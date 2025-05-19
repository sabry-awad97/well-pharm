import {
  type Product,
  useProductFilter,
  useProductSearch,
} from '@/api/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from '@tanstack/react-router';
import { ArrowUpDown, Loader2, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HighlightedText } from './highlighted-text';
import { ProductActions } from './product-actions';
import { ProductCategoryBadge } from './product-category-badge';
import { ProductFilters } from './product-filters';

// Number of items per page
const PAGE_SIZE = 10;

export function ProductListingPage() {
  const navigate = useNavigate();

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );
  const [selectedManufacturer, setSelectedManufacturer] = useState<
    string | undefined
  >(undefined);

  // State for sorting
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

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
    category: selectedCategory,
    manufacturer: selectedManufacturer,
  });

  // Determine which data source to use
  const products = useMemo(() => {
    if (debouncedQuery) return searchResults || [];
    return filteredProducts || [];
  }, [debouncedQuery, searchResults, filteredProducts]);

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!products) return [];

    return [...products].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined)
        return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined)
        return sortDirection === 'asc' ? 1 : -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [products, sortField, sortDirection]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedProducts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedProducts, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedProducts.length / PAGE_SIZE);

  // Handle sort toggle
  const handleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset pagination when filters or search change
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedCategory, selectedManufacturer]);

  // Loading and error states
  const isLoading = isSearchLoading || isFilterLoading;
  const error = searchError || filterError;

  // Navigate to create product page
  const handleCreateProduct = () => {
    navigate({ to: '/products/new' });
  };

  // Navigate to product details
  const handleViewProduct = (id: string) => {
    navigate({ to: '/products/$productId', params: { productId: id } });
  };

  // Navigate to edit product
  const handleEditProduct = (id: string) => {
    navigate({ to: '/products/$productId/edit', params: { productId: id } });
  };

  // Extract unique manufacturers for filter dropdown
  const manufacturers = useMemo(() => {
    if (!filteredProducts) return [];
    const uniqueManufacturers = new Set(
      filteredProducts.map(p => p.manufacturer),
    );
    return Array.from(uniqueManufacturers).sort();
  }, [filteredProducts]);

  return (
    <div className="container mx-auto space-y-6">
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

      {/* Search and Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ProductFilters
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedManufacturer={selectedManufacturer}
          setSelectedManufacturer={setSelectedManufacturer}
          manufacturers={manufacturers}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          <p>Error loading products: {String(error)}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <span className="ml-2">Loading products...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && paginatedProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-md border py-12 text-center flex-1 min-h-[calc(100vh-11rem)]">
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

      {/* Products table */}
      {!isLoading && paginatedProducts.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <button
                      type="button"
                      className="hover:text-primary flex items-center space-x-1"
                      onClick={() => handleSort('name')}
                    >
                      <span>Product Name</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Generic Name
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="hover:text-primary flex items-center space-x-1"
                      onClick={() => handleSort('category')}
                    >
                      <span>Category</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Dosage Form
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Strength
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="hover:text-primary flex items-center space-x-1"
                      onClick={() => handleSort('manufacturer')}
                    >
                      <span>Manufacturer</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="hover:text-primary text-left hover:underline"
                        onClick={() => handleViewProduct(product.id)}
                      >
                        <HighlightedText
                          text={product.name}
                          highlight={debouncedQuery}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <HighlightedText
                        text={product.genericName || '-'}
                        highlight={debouncedQuery}
                      />
                    </TableCell>
                    <TableCell>
                      <ProductCategoryBadge category={product.category} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {product.dosageForm}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {product.strength}
                    </TableCell>
                    <TableCell>
                      <HighlightedText
                        text={product.manufacturer}
                        highlight={debouncedQuery}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductActions
                        productId={product.id}
                        onView={() => handleViewProduct(product.id)}
                        onEdit={() => handleEditProduct(product.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    isActive={currentPage > 1}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
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
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
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
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage(p => Math.min(totalPages, p + 1))
                    }
                    isActive={currentPage < totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}

