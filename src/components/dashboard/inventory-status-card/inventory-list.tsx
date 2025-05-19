import type { InventoryItem } from '@/api/dashboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { memo } from 'react';
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
 * Component for displaying a list of inventory items
 */
export const InventoryList = memo(function InventoryList({
  items,
  expandedItems,
  isReordering,
  onToggleExpand,
  onReorder,
  onViewDetails,
}: InventoryListProps) {
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 pr-4">
        {items.map(item => (
          <InventoryItemComponent
            key={item.id}
            item={item}
            isExpanded={!!expandedItems[item.id]}
            isReordering={!!isReordering[item.id]}
            onToggleExpand={onToggleExpand}
            onReorder={onReorder}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </ScrollArea>
  );
});
