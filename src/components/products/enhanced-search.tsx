import type { Product } from '@/api/product';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface EnhancedSearchProps {
  products: Product[];
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function EnhancedSearch({
  products,
  onSearch,
  placeholder = 'Search products...',
  className,
}: EnhancedSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ['name', 'genericName', 'manufacturer', 'category'],
        includeScore: true,
        threshold: 0.4,
      }),
    [products],
  );

  // Update suggestions when input changes
  useEffect(() => {
    if (inputValue.length >= 2) {
      const results = fuse
        .search(inputValue)
        .slice(0, 5)
        .map(result => result.item);
      setSuggestions(results);
      setOpen(true);
    } else if (inputValue.length === 0) {
      setSuggestions(products.slice(0, 5));
      setOpen(true);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [inputValue, fuse, products]); // fuse is now stable due to useMemo

  // Handle search submission
  const handleSearch = () => {
    onSearch(inputValue);
    setOpen(false);
  };

  // Handle suggestion selection
  const handleSelect = (product: Product) => {
    setInputValue(product.name);
    onSearch(product.name);
    setOpen(false);
    inputRef.current?.focus();
  };

  // Clear search
  const handleClear = () => {
    setInputValue('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="pr-10 pl-10"
              aria-label="Search products"
            />
            {inputValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3"
                onClick={handleClear}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          side="bottom"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <Command>
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                {suggestions.map(product => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => handleSelect(product)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {product.genericName || product.category}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
