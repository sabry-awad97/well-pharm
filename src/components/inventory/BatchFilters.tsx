import type { InventoryItem } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';

interface BatchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  productFilter: string;
  setProductFilter: (productId: string) => void;
  expiryFilter: string;
  setExpiryFilter: (filter: string) => void;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setDateRange: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
  resetFilters: () => void;
  products?: InventoryItem[];
}

export function BatchFilters({
  searchQuery,
  setSearchQuery,
  productFilter,
  setProductFilter,
  expiryFilter,
  setExpiryFilter,
  dateRange,
  setDateRange,
  resetFilters,
  products,
}: BatchFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-y-0 md:space-x-4">
          <div className="flex-1 space-y-1">
            <label htmlFor="search" className="text-sm font-medium">
              Search
            </label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                id="search"
                type="search"
                placeholder="Search by batch number or product..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full space-y-1 md:w-[200px]">
            <label htmlFor="product-filter" className="text-sm font-medium">
              Product
            </label>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger id="product-filter">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products?.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1 md:w-[200px]">
            <label htmlFor="expiry-filter" className="text-sm font-medium">
              Expiry Status
            </label>
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger id="expiry-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="expiringSoon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1 md:w-[280px]">
            <label htmlFor="date-range" className="text-sm font-medium">
              Expiry Date Range
            </label>
            <DateRangePicker
              // id="date-range"
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          <div className="flex items-end space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={resetFilters}
              className="h-10 w-10"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
