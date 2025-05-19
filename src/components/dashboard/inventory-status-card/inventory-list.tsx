import type { InventoryItem } from '@/api/dashboard';
import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useEffect, useRef, useState } from 'react';
import { InventoryItemComponent } from './inventory-item';

interface InventoryListProps {
  items: InventoryItem[];
  expandedItems: Record<string, boolean>;
  isReordering: Record<string, boolean>;
  onToggleExpand: (itemId: string) => void;
  onReorder?: (item: InventoryItem) => void;
  onViewDetails?: (itemId: string) => void;
}

/**
 * Component for displaying a virtualized list of inventory items
 *
 * Uses TanStack Virtual for efficient rendering of large datasets by only
 * rendering items that are visible in the viewport.
 */
export const InventoryList = memo(function InventoryList({
  items,
  expandedItems,
  isReordering,
  onToggleExpand,
  onReorder,
  onViewDetails,
}: InventoryListProps) {
  // Container ref for the virtualized list
  const parentRef = useRef<HTMLDivElement>(null);

  // Track window size for responsive adjustments
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Estimated item sizes - we'll use dynamic measurement for actual rendering
  const estimatedItemHeight = 60; // Base height for collapsed items
  const estimatedExpandedExtra = 180; // Additional height when expanded

  // Create the virtualizer instance
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: index => {
      const item = items[index];
      // Estimate larger height for expanded items
      return expandedItems[item.id]
        ? estimatedItemHeight + estimatedExpandedExtra
        : estimatedItemHeight;
    },
    overscan: 5, // Render additional items outside viewport for smoother scrolling
    // Measure actual rendered sizes for more accurate virtualization
    measureElement: element => {
      return element.getBoundingClientRect().height + 8; // Reduced margin from 16px to 8px
    },
  });

  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      // Recalculate virtualizer measurements on resize
      virtualizer.measure();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [virtualizer]);

  // Recalculate when expanded state changes
  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer]);

  return (
    <div
      ref={parentRef}
      className="scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent h-[400px] overflow-auto pr-4"
      aria-label="Inventory items list"
      aria-roledescription="virtualized list"
    >
      {/* The total size div ensures proper scrollbar dimensions */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => {
          const item = items[virtualItem.index];
          return (
            <div
              key={item.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <InventoryItemComponent
                item={item}
                isExpanded={!!expandedItems[item.id]}
                isReordering={!!isReordering[item.id]}
                onToggleExpand={onToggleExpand}
                onReorder={onReorder}
                onViewDetails={onViewDetails}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
