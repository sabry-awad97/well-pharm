import type { InventoryItem } from '@/api/dashboard';
import { Package } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { DashboardCard } from '../dashboard-card';
import { FilterControls } from './filter-controls';
import { InventoryList } from './inventory-list';
import {
  type SortOption,
  filterInventoryItems,
  sortInventoryItems,
} from './utils';

interface InventoryStatusCardProps {
  lowStockItems?: InventoryItem[];
  onReorder?: (itemId: string, amount: number) => Promise<void>;
  onViewDetails?: (itemId: string) => void;
}

/**
 * Card component for displaying inventory status and low stock items
 */
export function InventoryStatusCard({
  lowStockItems,
  onReorder,
  onViewDetails,
}: InventoryStatusCardProps) {
  const isEmpty = !lowStockItems || lowStockItems.length === 0;

  // Local state for UI interactions
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [sortBy, setSortBy] = useState<SortOption>('percentRemaining');
  const [filterText, setFilterText] = useState('');
  const [isReordering, setIsReordering] = useState<Record<string, boolean>>({});

  // Toggle expanded state for an item
  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  // Handle reorder action
  const handleReorder = useCallback(
    async (item: InventoryItem) => {
      if (!onReorder) return;

      setIsReordering(prev => ({ ...prev, [item.id]: true }));
      try {
        await onReorder(
          item.id,
          item.reorderAmount || Math.max(item.threshold - item.stockLevel, 1),
        );
      } finally {
        setIsReordering(prev => ({ ...prev, [item.id]: false }));
      }
    },
    [onReorder],
  );

  // Filter and sort items based on current state
  const processedItems = useMemo(() => {
    if (!lowStockItems) return [];

    const filteredItems = filterInventoryItems(lowStockItems, filterText);
    return sortInventoryItems(filteredItems, sortBy);
  }, [lowStockItems, sortBy, filterText]);

  // Empty state content
  const emptyState = (
    <div className="text-center">
      <Package className="text-muted-foreground/50 mx-auto h-8 w-8" />
      <p className="text-muted-foreground mt-2 text-sm">No low stock items</p>
    </div>
  );

  return (
    <DashboardCard
      title="Inventory Status"
      description="Low stock items that need attention"
      className="col-span-3"
      isEmpty={isEmpty}
      emptyState={emptyState}
    >
      {!isEmpty && (
        <div className="space-y-4">
          {/* Controls for sorting and filtering */}
          <FilterControls
            filterText={filterText}
            setFilterText={setFilterText}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          {/* Items list */}
          <InventoryList
            items={processedItems}
            expandedItems={expandedItems}
            isReordering={isReordering}
            onToggleExpand={toggleExpand}
            onReorder={handleReorder}
            onViewDetails={onViewDetails}
          />
        </div>
      )}
    </DashboardCard>
  );
}
