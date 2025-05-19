import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useCallback } from 'react';
import type { SortOption } from './utils';

interface FilterControlsProps {
  filterText: string;
  setFilterText: (value: string) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
}

/**
 * Controls for filtering and sorting inventory items
 */
export function FilterControls({
  filterText,
  setFilterText,
  sortBy,
  setSortBy,
}: FilterControlsProps) {
  const handleSortChange = useCallback(
    (value: string) => setSortBy(value as SortOption),
    [setSortBy],
  );

  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <div className="relative w-full sm:w-64">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <Input
          placeholder="Search items..."
          className="pl-8"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          aria-label="Search inventory items"
        />
      </div>
      <Select value={sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="percentRemaining">Stock Level</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
