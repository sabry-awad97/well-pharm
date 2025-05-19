import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

interface ProductFiltersProps {
  selectedCategory: string | undefined;
  setSelectedCategory: (category: string | undefined) => void;
  selectedManufacturer: string | undefined;
  setSelectedManufacturer: (manufacturer: string | undefined) => void;
  manufacturers: string[];
}

export function ProductFilters({
  selectedCategory,
  setSelectedCategory,
  selectedManufacturer,
  setSelectedManufacturer,
  manufacturers,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = selectedCategory || selectedManufacturer;

  const handleClearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedManufacturer(undefined);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={hasActiveFilters ? 'default' : 'outline'}
            size="sm"
            className="h-10"
          >
            <Filter className="mr-2 h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-primary-foreground text-primary ml-2 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                {(selectedCategory ? 1 : 0) + (selectedManufacturer ? 1 : 0)}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="leading-none font-medium">Category</h4>
              <Select
                value={selectedCategory || 'all'}
                onValueChange={value =>
                  setSelectedCategory(value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="Prescription">Prescription</SelectItem>
                  <SelectItem value="OTC">OTC</SelectItem>
                  <SelectItem value="Supplement">Supplement</SelectItem>
                  <SelectItem value="MedicalDevice">Medical Device</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h4 className="leading-none font-medium">Manufacturer</h4>
              <Select
                value={selectedManufacturer || 'all'}
                onValueChange={value =>
                  setSelectedManufacturer(value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All manufacturers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All manufacturers</SelectItem>
                  {manufacturers.map(manufacturer => (
                    <SelectItem key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
              >
                <X className="mr-2 h-4 w-4" />
                <span>Clear filters</span>
              </Button>
              <Button size="sm" onClick={() => setIsOpen(false)}>
                <span>Apply filters</span>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-10"
        >
          <X className="mr-2 h-4 w-4" />
          <span>Clear</span>
        </Button>
      )}
    </div>
  );
}
