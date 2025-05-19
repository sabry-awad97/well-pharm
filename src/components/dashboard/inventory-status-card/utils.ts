import type { InventoryItemPrioritySchema } from '@/api/dashboard';
import type { z } from 'zod';

/**
 * Get text color class based on stock percentage
 * @param percent - The percentage of stock remaining
 * @returns Tailwind CSS class for text color
 */
export function getStatusColor(percent: number): string {
  if (percent < 20) return 'text-red-500';
  if (percent < 50) return 'text-amber-500';
  return 'text-emerald-500';
}

/**
 * Get badge color classes based on priority level
 * @param priority - The priority level of the inventory item
 * @returns Tailwind CSS classes for badge styling
 */
export function getPriorityColor(
  priority?: z.infer<typeof InventoryItemPrioritySchema>,
): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
    case 'medium':
      return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
    case 'low':
      return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20';
  }
}

/**
 * Sort options for inventory items
 */
export type SortOption = 'name' | 'percentRemaining' | 'priority';

/**
 * Sort inventory items based on the selected sort option
 * @param items - Array of inventory items to sort
 * @param sortBy - Sort option to apply
 * @returns Sorted array of inventory items
 */
export function sortInventoryItems<
  T extends {
    name: string;
    percentRemaining: number;
    priority?: z.infer<typeof InventoryItemPrioritySchema>;
  },
>(items: T[], sortBy: SortOption): T[] {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'percentRemaining':
        return a.percentRemaining - b.percentRemaining;
      case 'priority': {
        const priorityValues = { high: 0, medium: 1, low: 2 };
        return (
          (priorityValues[a.priority || 'low'] || 0) -
          (priorityValues[b.priority || 'low'] || 0)
        );
      }
      default:
        return 0;
    }
  });
}

/**
 * Filter inventory items based on search text
 * @param items - Array of inventory items to filter
 * @param filterText - Text to filter by
 * @returns Filtered array of inventory items
 */
export function filterInventoryItems<
  T extends { name: string; category?: string; supplier?: string },
>(items: T[], filterText: string): T[] {
  if (!filterText) return items;

  const lowerCaseFilter = filterText.toLowerCase();
  return items.filter(
    item =>
      item.name.toLowerCase().includes(lowerCaseFilter) ||
      item.category?.toLowerCase().includes(lowerCaseFilter) ||
      item.supplier?.toLowerCase().includes(lowerCaseFilter),
  );
}
