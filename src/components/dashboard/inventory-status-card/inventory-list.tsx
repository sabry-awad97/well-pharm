import type { InventoryItem } from '@/api/dashboard';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
import { InventoryItemComponent } from './inventory-item';

// Create a wrapper component for individual inventory items with scroll-triggered animations
const AnimatedInventoryItem = memo(function AnimatedInventoryItem({
  item,
  index,
  isExpanded,
  isReordering,
  onToggleExpand,
  onReorder,
  onViewDetails,
}: {
  item: InventoryItem;
  index: number;
  isExpanded: boolean;
  isReordering: boolean;
  onToggleExpand: (itemId: string) => void;
  onReorder?: (item: InventoryItem) => void;
  onViewDetails?: (itemId: string) => void;
}) {
  const itemRef = useRef(null);
  const isInView = useInView(itemRef, { once: true, amount: 0.3 });

  // Enhanced animation variants with staggered entrance
  const enhancedItemVariants = {
    hidden: {
      opacity: 0,
      x: -40,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1], // Custom easing curve
        delay: Math.min(0.05, index * 0.015), // Staggered delay based on item index
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      ref={itemRef}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      exit="exit"
      variants={enhancedItemVariants}
    >
      <InventoryItemComponent
        item={item}
        isExpanded={isExpanded}
        isReordering={isReordering}
        onToggleExpand={onToggleExpand}
        onReorder={onReorder}
        onViewDetails={onViewDetails}
      />
    </motion.div>
  );
});

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
  const [_windowSize, setWindowSize] = useState({
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
        <AnimatePresence>
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
                <AnimatedInventoryItem
                  item={item}
                  index={virtualItem.index}
                  isExpanded={!!expandedItems[item.id]}
                  isReordering={!!isReordering[item.id]}
                  onToggleExpand={onToggleExpand}
                  onReorder={onReorder}
                  onViewDetails={onViewDetails}
                />
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});
