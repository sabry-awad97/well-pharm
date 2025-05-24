import {
  type Product,
  useProductFilter,
  useProductSearch,
} from '@/api/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryClient } from '@tanstack/react-query';
import {
  type SortingState,
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EnhancedSearch } from './enhanced-search';
import { HighlightedText } from './highlighted-text';
import { ProductActions } from './product-actions';
import { ProductCategoryBadge } from './product-category-badge';
import { ProductCategoryChart } from './product-category-chart';
import { ProductDialog } from './product-dialog';
import { type FilterOptions, ProductFilters } from './product-filters';
import { ProductGridView } from './product-grid-view';
import { StockLevelIndicator } from './stock-level-indicator';
import { TableCustomization } from './table-customization';
import { ViewToggle } from './view-toggle';
import { VirtualizedTable } from './virtualized-table';

// Number of items per page
const PAGE_SIZE = 10;

export function ProductListingPage() {
  const queryClient = useQueryClient();

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Enhanced filter state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    manufacturers: [],
    selectedCategories: [],
    selectedManufacturers: [],
  });

  // View state (table or grid)
  const [view, setView] = useState<'table' | 'grid'>('table');

  // Tab state for analytics
  const [activeTab, setActiveTab] = useState('products');

  // State for sorting
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);

  // State for column visibility
  const [columnVisibility, setColumnVisibility] = useState({});

  // State for row selection
  const [rowSelection, setRowSelection] = useState({});

  // State for dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products based on search or filters
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = useProductSearch(debouncedQuery);

  const {
    data: filteredProducts,
    isLoading: isFilterLoading,
    error: filterError,
  } = useProductFilter({
    category:
      filterOptions.selectedCategories.length > 0
        ? filterOptions.selectedCategories.join(',')
        : undefined,
    manufacturer:
      filterOptions.selectedManufacturers.length > 0
        ? filterOptions.selectedManufacturers.join(',')
        : undefined,
    dateFrom: filterOptions.dateRange?.from?.toISOString(),
    dateTo: filterOptions.dateRange?.to?.toISOString(),
    priceMin: filterOptions.priceRange?.min?.toString(),
    priceMax: filterOptions.priceRange?.max?.toString(),
  });

  // Determine which data source to use
  const products = useMemo(() => {
    if (debouncedQuery) return searchResults || [];
    return filteredProducts || [];
  }, [debouncedQuery, searchResults, filteredProducts]);

  // Extract unique categories and manufacturers for filters
  useEffect(() => {
    if (filteredProducts) {
      const categories = Array.from(
        new Set(filteredProducts.map(p => p.category)),
      ).sort();
      const manufacturers = Array.from(
        new Set(filteredProducts.map(p => p.manufacturer)),
      ).sort();

      setFilterOptions(prev => ({
        ...prev,
        categories,
        manufacturers,
      }));
    }
  }, [filteredProducts]);

  // Loading and error states
  const isLoading = isSearchLoading || isFilterLoading;
  const error = searchError || filterError;

  // Handle create product dialog
  const handleCreateProduct = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  // Handle view product dialog
  const handleViewProduct = useCallback((id: string) => {
    setSelectedProductId(id);
    setViewDialogOpen(true);
  }, []);

  // Handle edit product dialog
  const handleEditProduct = useCallback((id: string) => {
    setSelectedProductId(id);
    setEditDialogOpen(true);
  }, []);

  // Handle dialog success (refresh data)
  const handleDialogSuccess = useCallback(() => {
    // Invalidate queries to refresh the product list
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterOptions>) => {
      setFilterOptions(prev => ({
        ...prev,
        ...newFilters,
      }));
    },
    [],
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilterOptions(prev => ({
      ...prev,
      selectedCategories: [],
      selectedManufacturers: [],
      dateRange: undefined,
      priceRange: undefined,
    }));
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const columns = useMemo(() => {
    // Column definitions for TanStack Table
    const columnHelper = createColumnHelper<Product>();

    return [
      // Selection column
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      }),

      columnHelper.accessor('name', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:text-primary flex items-center space-x-1 p-0 font-medium"
          >
            <span>Product Name</span>
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">
            <button
              type="button"
              className="hover:text-primary text-left hover:underline"
              onClick={() => handleViewProduct(row.original.id)}
            >
              <HighlightedText
                text={row.original.name}
                highlight={debouncedQuery}
              />
            </button>
          </div>
        ),
        size: 250,
      }),
      columnHelper.accessor('genericName', {
        header: 'Generic Name',
        cell: ({ row }) => (
          <div className="hidden md:block">
            <HighlightedText
              text={row.original.genericName || '-'}
              highlight={debouncedQuery}
            />
          </div>
        ),
      }),
      columnHelper.accessor('category', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:text-primary flex items-center space-x-1 p-0 font-medium"
          >
            <span>Category</span>
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <ProductCategoryBadge category={row.original.category} />
        ),
      }),
      columnHelper.accessor('dosageForm', {
        header: 'Dosage Form',
        cell: ({ row }) => (
          <div className="hidden lg:block">{row.original.dosageForm}</div>
        ),
      }),
      columnHelper.accessor('strength', {
        header: 'Strength',
        cell: ({ row }) => (
          <div className="hidden lg:block">{row.original.strength}</div>
        ),
      }),
      columnHelper.accessor('manufacturer', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:text-primary flex items-center space-x-1 p-0 font-medium"
          >
            <span>Manufacturer</span>
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <HighlightedText
            text={row.original.manufacturer}
            highlight={debouncedQuery}
          />
        ),
      }),
      // Stock level column (visual indicator)
      columnHelper.display({
        id: 'stockLevel',
        header: 'Stock Level',
        cell: () => {
          // Mock data for demonstration - replace with actual data
          const stockLevel = Math.floor(Math.random() * 100);
          const threshold = 20;
          const maxStock = 100;

          return (
            <StockLevelIndicator
              stockLevel={stockLevel}
              threshold={threshold}
              maxStock={maxStock}
              className="w-24"
            />
          );
        },
        enableSorting: true,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <ProductActions
              productId={row.original.id}
              onView={() => handleViewProduct(row.original.id)}
              onEdit={() => handleEditProduct(row.original.id)}
            />
          </div>
        ),
      }),
    ];
  }, [debouncedQuery, handleViewProduct, handleEditProduct]);

  // Initialize TanStack Table
  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: PAGE_SIZE,
      },
    },
  });

  // Reset pagination when filters or search change
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    table.resetPageIndex();
  }, [debouncedQuery, filterOptions, table]);

  // Calculate total pages for custom pagination UI
  const totalPages = Math.ceil(
    table.getFilteredRowModel().rows.length / PAGE_SIZE,
  );
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="container mx-auto space-y-6">
      {/* Product Dialogs */}
      <ProductDialog
        mode="create"
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <ProductDialog
        mode="view"
        productId={selectedProductId}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      <ProductDialog
        mode="edit"
        productId={selectedProductId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your pharmacy product inventory
          </p>
        </div>
        <Button onClick={handleCreateProduct} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          <span>Add New Product</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
            <EnhancedSearch
              products={filteredProducts || []}
              onSearch={handleSearch}
              placeholder="Search products..."
              className="w-full"
            />

            <div className="flex flex-wrap items-center gap-2">
              <ViewToggle view={view} onViewChange={setView} />
              <TableCustomization table={table} />
            </div>
          </div>

          <ProductFilters
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          {/* Error state */}
          {error && (
            <div
              className="bg-destructive/10 text-destructive rounded-md p-4"
              role="alert"
            >
              <p>Error loading products: {String(error)}</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div
              className="flex items-center justify-center py-8"
              aria-live="polite"
            >
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <span className="ml-2">Loading products...</span>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && table.getRowModel().rows.length === 0 && (
            <div className="flex min-h-[calc(100vh-11rem)] flex-1 flex-col items-center justify-center rounded-md border py-12 text-center">
              <div className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                <Search className="text-primary h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {debouncedQuery
                  ? `No products match "${debouncedQuery}"`
                  : 'Try adjusting your filters or add a new product'}
              </p>
              <Button
                onClick={handleCreateProduct}
                variant="outline"
                className="mt-6"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
            </div>
          )}

          {/* Products display (table or grid) */}
          {!isLoading && table.getRowModel().rows.length > 0 && (
            <>
              {view === 'table' ? (
                <VirtualizedTable table={table} />
              ) : (
                <ProductGridView
                  products={table.getRowModel().rows.map(row => row.original)}
                  onView={handleViewProduct}
                  onEdit={handleEditProduct}
                />
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => table.previousPage()}
                        isActive={table.getCanPreviousPage()}
                        aria-disabled={!table.getCanPreviousPage()}
                        className={
                          !table.getCanPreviousPage()
                            ? 'pointer-events-none opacity-50'
                            : 'hover:cursor-pointer'
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }).map(
                      (_, i) => {
                        let pageNum: number;

                        // Logic to show pages around current page
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 &&
                            pageNum <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem
                              className="hover:cursor-pointer"
                              key={pageNum}
                            >
                              <PaginationLink
                                onClick={() => table.setPageIndex(pageNum - 1)}
                                isActive={currentPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }

                        return null;
                      },
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => table.nextPage()}
                        isActive={table.getCanNextPage()}
                        aria-disabled={!table.getCanNextPage()}
                        className={
                          !table.getCanNextPage()
                            ? 'pointer-events-none opacity-50'
                            : 'hover:cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <ProductCategoryChart products={products} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                {/* Additional analytics could go here */}
                <h3 className="mb-4 text-lg font-medium">Product Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Total Products
                    </p>
                    <p className="text-2xl font-bold">{products.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Categories</p>
                    <p className="text-2xl font-bold">
                      {new Set(products.map(p => p.category)).size}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Manufacturers
                    </p>
                    <p className="text-2xl font-bold">
                      {new Set(products.map(p => p.manufacturer)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
