import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, Filter } from 'lucide-react';
import { useState } from 'react';

export interface FilterOptions {
  categories: string[];
  manufacturers: string[];
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  priceRange?: {
    min: number | undefined;
    max: number | undefined;
  };
  selectedCategories: string[];
  selectedManufacturers: string[];
}

interface ProductFiltersProps {
  filterOptions: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onClearFilters: () => void;
}

export function ProductFilters({
  filterOptions,
  onFilterChange,
  onClearFilters,
}: ProductFiltersProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [manufacturerOpen, setManufacturerOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  const activeFilterCount = [
    filterOptions.selectedCategories.length > 0,
    filterOptions.selectedManufacturers.length > 0,
    filterOptions.dateRange?.from !== undefined ||
      filterOptions.dateRange?.to !== undefined,
    filterOptions.priceRange?.min !== undefined ||
      filterOptions.priceRange?.max !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Filter className="mr-2 h-3.5 w-3.5" />
            Categories
            {filterOptions.selectedCategories.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 rounded-sm px-1 font-normal lg:hidden"
              >
                {filterOptions.selectedCategories.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>
              <CommandGroup>
                {filterOptions.categories.map(category => {
                  const isSelected =
                    filterOptions.selectedCategories.includes(category);
                  return (
                    <CommandItem
                      key={category}
                      onSelect={() => {
                        const updated = isSelected
                          ? filterOptions.selectedCategories.filter(
                              c => c !== category,
                            )
                          : [...filterOptions.selectedCategories, category];
                        onFilterChange({ selectedCategories: updated });
                      }}
                    >
                      <div
                        className={cn(
                          'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible',
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <span>{category}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={manufacturerOpen} onOpenChange={setManufacturerOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Filter className="mr-2 h-3.5 w-3.5" />
            Manufacturers
            {filterOptions.selectedManufacturers.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 rounded-sm px-1 font-normal lg:hidden"
              >
                {filterOptions.selectedManufacturers.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search manufacturers..." />
            <CommandList>
              <CommandEmpty>No manufacturers found.</CommandEmpty>
              <CommandGroup>
                {filterOptions.manufacturers.map(manufacturer => {
                  const isSelected =
                    filterOptions.selectedManufacturers.includes(manufacturer);
                  return (
                    <CommandItem
                      key={manufacturer}
                      onSelect={() => {
                        const updated = isSelected
                          ? filterOptions.selectedManufacturers.filter(
                              m => m !== manufacturer,
                            )
                          : [
                              ...filterOptions.selectedManufacturers,
                              manufacturer,
                            ];
                        onFilterChange({ selectedManufacturers: updated });
                      }}
                    >
                      <div
                        className={cn(
                          'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible',
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <span>{manufacturer}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Filter className="mr-2 h-3.5 w-3.5" />
            Date Range
            {(filterOptions.dateRange?.from || filterOptions.dateRange?.to) && (
              <Badge
                variant="secondary"
                className="ml-1 rounded-sm px-1 font-normal lg:hidden"
              >
                ✓
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Calendar
                  mode="single"
                  selected={filterOptions.dateRange?.from}
                  onSelect={date =>
                    onFilterChange({
                      dateRange: {
                        from: date,
                        to: filterOptions.dateRange?.to,
                      },
                    })
                  }
                  initialFocus
                />
                <Calendar
                  mode="single"
                  selected={filterOptions.dateRange?.to}
                  onSelect={date =>
                    onFilterChange({
                      dateRange: {
                        from: filterOptions.dateRange?.from,
                        to: date,
                      },
                    })
                  }
                  initialFocus
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onFilterChange({
                    dateRange: { from: undefined, to: undefined },
                  })
                }
              >
                Clear
              </Button>
              <Button size="sm" onClick={() => setDateOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={priceOpen} onOpenChange={setPriceOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Filter className="mr-2 h-3.5 w-3.5" />
            Price Range
            {(filterOptions.priceRange?.min !== undefined ||
              filterOptions.priceRange?.max !== undefined) && (
              <Badge
                variant="secondary"
                className="ml-1 rounded-sm px-1 font-normal lg:hidden"
              >
                ✓
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-3" align="start">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  className="h-8 w-20"
                  value={filterOptions.priceRange?.min || ''}
                  onChange={e =>
                    onFilterChange({
                      priceRange: {
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                        max: filterOptions.priceRange?.max,
                      },
                    })
                  }
                />
                <span>to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  className="h-8 w-20"
                  value={filterOptions.priceRange?.max || ''}
                  onChange={e =>
                    onFilterChange({
                      priceRange: {
                        min: filterOptions.priceRange?.min,
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onFilterChange({
                    priceRange: { min: undefined, max: undefined },
                  })
                }
              >
                Clear
              </Button>
              <Button size="sm" onClick={() => setPriceOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 lg:px-3"
          onClick={onClearFilters}
        >
          Clear filters
          <Badge
            variant="secondary"
            className="ml-1 rounded-sm px-1 font-normal"
          >
            {activeFilterCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
