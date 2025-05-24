import { type BatchItem, useExpiringBatches } from '@/api/batch';
import { useInventoryItems } from '@/api/inventory';
import { BatchForm } from '@/components/inventory/BatchForm';
import { BatchTransactionForm } from '@/components/inventory/BatchTransactionForm';
import { ExpiringBatchesAlert } from '@/components/inventory/ExpiringBatchesAlert';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertCircle,
  BarChart2,
  Filter,
  Inbox,
  Loader2,
  Package,
  PlusCircle,
  RotateCcw,
  SortAsc,
  SortDesc,
  TrendingUp,
} from 'lucide-react'; // Added more icons
import { useMemo, useState } from 'react';
import { InventoryTrends } from './InventoryTrends';

export default function InventoryManagementPage() {
  // Navigation
  const navigate = useNavigate();

  // State for active tab
  const [activeTab, setActiveTab] = useState('inventory');

  // State for filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // State for batch management
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);

  // Fetch products data
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useInventoryItems(); // Added error state

  // Fetch expiring batches
  const { data: expiringBatches, isLoading: expiringBatchesLoading } =
    useExpiringBatches(30); // Added loading state

  // Derived state for categories (from products)
  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = new Set<string>();
    for (const product of products) {
      if (product.category) uniqueCategories.add(product.category);
    }
    return Array.from(uniqueCategories);
  }, [products]);

  // Filter and sort inventory items
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const filteredItems = useMemo(() => {
    if (!products) return [];

    return products
      .filter(product => {
        // Search query filter
        const matchesSearch =
          searchQuery === '' ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase());

        // Category filter
        const matchesCategory =
          categoryFilter === 'all' || product.category === categoryFilter;

        // Stock level filter
        let matchesStock = true;
        if (stockFilter === 'low') {
          matchesStock = (product.stockLevel || 0) < (product.threshold || 20);
        } else if (stockFilter === 'out') {
          matchesStock = (product.stockLevel || 0) === 0;
        }

        // Expiry filter (would need to join with batch data for complete implementation)
        const matchesExpiry = true;

        return (
          matchesSearch && matchesCategory && matchesStock && matchesExpiry
        );
      })
      .sort((a, b) => {
        // Sort by selected field
        if (sortField === 'name') {
          return sortDirection === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }
        if (sortField === 'stock') {
          const stockA = a.stockLevel || 0;
          const stockB = b.stockLevel || 0;
          return sortDirection === 'asc' ? stockA - stockB : stockB - stockA;
        }
        if (sortField === 'price') {
          const priceA = a.sellingPrice || 0;
          const priceB = b.sellingPrice || 0;
          return sortDirection === 'asc' ? priceA - priceB : priceB - priceA;
        }
        return 0;
      });
  }, [
    products,
    searchQuery,
    categoryFilter,
    stockFilter,
    expiryFilter,
    sortField,
    sortDirection,
  ]);

  // Handle batch management
  const handleAddBatch = (_productId: string) => {
    // This function might need adjustment if you want a general "Add Batch" button
    // For now, it's tied to a productId, implying it's called from a product context
    setSelectedBatch(null); // Reset selected batch
    // If you need to select a product first, that logic would go here or be part of the trigger
    setIsBatchFormOpen(true);
  };

  const handleEditBatch = (batch: BatchItem) => {
    setSelectedBatch(batch);
    setIsBatchFormOpen(true);
  };

  const handleRecordTransaction = (batch: BatchItem) => {
    setSelectedBatch(batch);
    setIsTransactionFormOpen(true);
  };

  const handleViewExpiringBatches = () => {
    navigate({ to: '/inventory/expiring' });
  };

  const handleFormSuccess = () => {
    setSelectedBatch(null);
    setIsBatchFormOpen(false); // Close form on success
    setIsTransactionFormOpen(false); // Close form on success
    // Optionally, refetch data here if needed
  };

  // Calculate some quick stats (examples)
  const totalProducts = products?.length || 0;
  const lowStockItems = useMemo(
    () =>
      products?.filter(p => (p.stockLevel || 0) < (p.threshold || 20)).length ||
      0,
    [products],
  );
  const outOfStockItems = useMemo(
    () => products?.filter(p => (p.stockLevel || 0) === 0).length || 0,
    [products],
  );

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 md:px-6">
      <PageHeader
        title="Inventory Dashboard"
        description="Oversee your inventory, track stock, and manage product batches efficiently."
      />

      {/* Quick Stats Section - improved grid spacing and responsiveness */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productsLoading ? '...' : totalProducts}
            </div>
            <p className="text-muted-foreground text-xs">
              Number of unique product lines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productsLoading ? '...' : lowStockItems}
            </div>
            <p className="text-muted-foreground text-xs">
              Items needing reorder soon
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Inbox className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productsLoading ? '...' : outOfStockItems}
            </div>
            <p className="text-muted-foreground text-xs">
              Items currently unavailable
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expiringBatchesLoading ? '...' : expiringBatches?.length || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Batches expiring in next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring batches alert - better positioning */}
      <div className="my-2">
        {expiringBatches && expiringBatches.length > 0 && (
          <ExpiringBatchesAlert
            days={30}
            count={expiringBatches.length}
            onViewDetails={handleViewExpiringBatches}
          />
        )}
      </div>

      {/* Improved tabs layout with better spacing, accessibility and responsive design */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
        aria-label="Inventory management tabs"
      >
        <div className="mb-6 border-b pb-2">
          <TabsList className="inline-flex h-10 w-auto space-x-2 bg-transparent p-0">
            <TabsTrigger
              value="inventory"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex items-center gap-2 rounded-md px-4 py-2"
              aria-controls="inventory-tab-content"
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>Inventory List</span>
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex items-center gap-2 rounded-md px-4 py-2"
              aria-controls="trends-tab-content"
            >
              <BarChart2 className="h-4 w-4" aria-hidden="true" />
              <span>Performance Trends</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="inventory"
          className="mt-0 space-y-4"
          id="inventory-tab-content"
          role="tabpanel"
        >
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => setIsBatchFormOpen(true)}
              variant="outline"
              className="h-9 whitespace-nowrap"
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Add
              New Batch
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-5 w-5" aria-hidden="true" />
                  Filter & Sort Products
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setStockFilter('all');
                    setExpiryFilter('all');
                    setSortField('name');
                    setSortDirection('asc');
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />{' '}
                  Reset Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Products</Label>
                  <Input
                    id="search"
                    placeholder="Enter product name, SKU, etc."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    aria-label="Search products"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Filter by Category</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    aria-label="Filter by category"
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Filter by Stock Level</Label>
                  <Select
                    value={stockFilter}
                    onValueChange={setStockFilter}
                    aria-label="Filter by stock level"
                  >
                    <SelectTrigger id="stock">
                      <SelectValue placeholder="All Stock Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock Levels</SelectItem>
                      <SelectItem value="low">Low Stock</SelectItem>
                      <SelectItem value="out">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortField">Sort By</Label>
                  <div className="flex gap-2">
                    <Select
                      value={sortField}
                      onValueChange={setSortField}
                      aria-label="Sort by field"
                    >
                      <SelectTrigger id="sortField">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="stock">Stock Level</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSortDirection(prev =>
                          prev === 'asc' ? 'desc' : 'asc',
                        )
                      }
                      aria-label={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                      {sortDirection === 'asc' ? (
                        <SortAsc className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <SortDesc className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table Section with improved loading states */}
          <div className="mt-6">
            {productsLoading && (
              <div className="flex justify-center py-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                  <p className="text-muted-foreground text-sm">
                    Loading inventory data...
                  </p>
                </div>
              </div>
            )}
            {productsError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
                <h3 className="mt-2 font-medium text-red-800">
                  Error loading inventory data
                </h3>
                <p className="mt-1 text-sm text-red-600">
                  Please try again later.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Retry
                </Button>
              </div>
            )}
            {!productsLoading &&
              !productsError &&
              products &&
              products.length === 0 && (
                <div className="border-muted rounded-md border p-6 text-center">
                  <Inbox className="text-muted-foreground mx-auto h-12 w-12" />
                  <h3 className="mt-2 text-sm font-medium">
                    No products found
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    No products match your current filters, or no products have
                    been added yet.
                  </p>
                </div>
              )}
            {!productsLoading &&
              !productsError &&
              products &&
              products.length > 0 && (
                <InventoryTable
                  items={filteredItems}
                  isLoading={productsLoading}
                  onAddBatch={handleAddBatch}
                  onEditBatch={handleEditBatch}
                  onRecordTransaction={handleRecordTransaction}
                />
              )}
          </div>
        </TabsContent>

        <TabsContent
          value="trends"
          className="mt-0 space-y-4"
          id="trends-tab-content"
          role="tabpanel"
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Inventory Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                    <p className="text-muted-foreground text-sm">
                      Loading trend data...
                    </p>
                  </div>
                </div>
              ) : (
                <InventoryTrends />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debug Panel - only visible in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 rounded-md border border-yellow-200 bg-yellow-50 p-4">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-yellow-800">
                Debug Panel (Development Only)
              </summary>
              <div className="mt-2 space-y-2 text-xs">
                <div>
                  <strong>Active Tab:</strong> {activeTab}
                </div>
                <div>
                  <strong>Search Query:</strong> {searchQuery || '(empty)'}
                </div>
                <div>
                  <strong>Category Filter:</strong> {categoryFilter}
                </div>
                <div>
                  <strong>Stock Filter:</strong> {stockFilter}
                </div>
                <div>
                  <strong>Sort:</strong> {sortField} ({sortDirection})
                </div>
                <div>
                  <strong>Total Products:</strong> {products?.length || 0}
                </div>
                <div>
                  <strong>Filtered Items:</strong> {filteredItems.length}
                </div>
                <div>
                  <strong>Loading State:</strong>{' '}
                  {productsLoading ? 'Loading' : 'Loaded'}
                </div>
                <div>
                  <strong>Error State:</strong>{' '}
                  {productsError ? 'Error' : 'No Error'}
                </div>
              </div>
            </details>
          </div>
        )}
      </Tabs>

      {/* Modals for Batch Management */}
      {isBatchFormOpen && (
        <BatchForm
          open={isBatchFormOpen}
          onOpenChange={setIsBatchFormOpen}
          onSuccess={handleFormSuccess}
          batch={selectedBatch}
          productId={selectedBatch?.productId || ''}
        />
      )}

      {isTransactionFormOpen && selectedBatch && (
        <BatchTransactionForm
          open={isTransactionFormOpen}
          onOpenChange={setIsTransactionFormOpen}
          onSuccess={handleFormSuccess}
          batch={selectedBatch}
        />
      )}
    </div>
  );
}
