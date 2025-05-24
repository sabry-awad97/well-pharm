import {
  type BatchItem,
  useExpiringBatches,
  useListAllBatches,
} from '@/api/batch';
import { useInventoryItems } from '@/api/inventory';
import { BatchFilters } from '@/components/inventory/BatchFilters';
import { BatchForm } from '@/components/inventory/BatchForm';
import { BatchSummaryCards } from '@/components/inventory/BatchSummaryCards';
import { BatchTable } from '@/components/inventory/BatchTable';
import { BatchTransactionForm } from '@/components/inventory/BatchTransactionForm';
import { BatchTransactionHistory } from '@/components/inventory/BatchTransactionHistory';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addDays, isAfter, isBefore } from 'date-fns';
import { PackagePlus } from 'lucide-react';
import { useMemo, useState } from 'react';

type SortField = 'batchNumber' | 'productName' | 'quantity' | 'expiryDate';
type SortDirection = 'asc' | 'desc';

export default function BatchManagementPage() {
  // State for batch management
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [sortField, setSortField] = useState<SortField>('expiryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch batches data
  const {
    data: batches,
    isLoading: batchesLoading,
    error: batchesError,
  } = useListAllBatches();

  // Fetch products data for filtering
  const { data: products } = useInventoryItems();

  // Fetch expiring batches
  const { data: expiringBatches } = useExpiringBatches(30);

  // Handle batch management
  const handleAddBatch = () => {
    setSelectedBatch(null);
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

  const handleViewHistory = (batch: BatchItem) => {
    setSelectedBatch(batch);
    setIsHistoryOpen(true);
  };

  const handleFormSuccess = () => {
    setSelectedBatch(null);
    setIsBatchFormOpen(false);
    setIsTransactionFormOpen(false);
    setIsHistoryOpen(false);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setProductFilter('all');
    setExpiryFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  // Filter and sort batches
  const filteredBatches = useMemo(() => {
    if (!batches) return [];

    return batches
      .filter(batch => {
        // Search query filter
        const matchesSearch =
          searchQuery === '' ||
          batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (products?.find(p => p.id === batch.productId)?.name || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        // Product filter
        const matchesProduct =
          productFilter === 'all' || batch.productId === productFilter;

        // Expiry filter
        let matchesExpiry = true;
        if (expiryFilter === 'expiringSoon' && batch.expiryDate) {
          const expiryDate = new Date(batch.expiryDate);
          const thirtyDaysFromNow = addDays(new Date(), 30);
          matchesExpiry =
            isBefore(expiryDate, thirtyDaysFromNow) &&
            isAfter(expiryDate, new Date());
        } else if (expiryFilter === 'expired' && batch.expiryDate) {
          matchesExpiry = isBefore(new Date(batch.expiryDate), new Date());
        } else if (expiryFilter === 'valid' && batch.expiryDate) {
          matchesExpiry = isAfter(new Date(batch.expiryDate), new Date());
        }

        // Date range filter
        let matchesDateRange = true;
        if (dateRange.from && dateRange.to && batch.expiryDate) {
          const expiryDate = new Date(batch.expiryDate);
          matchesDateRange =
            isAfter(expiryDate, dateRange.from) &&
            isBefore(expiryDate, addDays(dateRange.to, 1));
        }

        return (
          matchesSearch && matchesProduct && matchesExpiry && matchesDateRange
        );
      })
      .sort((a, b) => {
        // Sort by selected field
        if (sortField === 'batchNumber') {
          return sortDirection === 'asc'
            ? a.batchNumber.localeCompare(b.batchNumber)
            : b.batchNumber.localeCompare(a.batchNumber);
        }
        if (sortField === 'productName') {
          const productA =
            products?.find(p => p.id === a.productId)?.name || '';
          const productB =
            products?.find(p => p.id === b.productId)?.name || '';
          return sortDirection === 'asc'
            ? productA.localeCompare(productB)
            : productB.localeCompare(productA);
        }
        if (sortField === 'quantity') {
          return sortDirection === 'asc'
            ? a.quantity - b.quantity
            : b.quantity - a.quantity;
        }
        if (sortField === 'expiryDate') {
          if (!a.expiryDate) return sortDirection === 'asc' ? 1 : -1;
          if (!b.expiryDate) return sortDirection === 'asc' ? -1 : 1;
          return sortDirection === 'asc'
            ? new Date(a.expiryDate).getTime() -
                new Date(b.expiryDate).getTime()
            : new Date(b.expiryDate).getTime() -
                new Date(a.expiryDate).getTime();
        }
        return 0;
      });
  }, [
    batches,
    products,
    searchQuery,
    productFilter,
    expiryFilter,
    dateRange,
    sortField,
    sortDirection,
  ]);

  // Calculate metrics
  const totalBatches = batches?.length || 0;
  const expiringSoonCount = expiringBatches?.length || 0;
  const lowStockCount = batches?.filter(b => b.quantity < 10).length || 0;

  // Filter batches based on active tab
  const tabFilteredBatches = useMemo(() => {
    if (activeTab === 'all') return filteredBatches;
    if (activeTab === 'expiring') {
      return filteredBatches.filter(batch => {
        if (!batch.expiryDate) return false;
        const expiryDate = new Date(batch.expiryDate);
        const thirtyDaysFromNow = addDays(new Date(), 30);
        return (
          isBefore(expiryDate, thirtyDaysFromNow) &&
          isAfter(expiryDate, new Date())
        );
      });
    }
    if (activeTab === 'lowStock') {
      return filteredBatches.filter(batch => batch.quantity < 10);
    }
    return filteredBatches;
  }, [filteredBatches, activeTab]);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 md:px-6">
      <PageHeader
        title="Batch Management"
        description="Track, manage, and monitor all product batches in your inventory."
      />

      {/* Summary Cards */}
      <BatchSummaryCards
        totalBatches={totalBatches}
        expiringSoonCount={expiringSoonCount}
        lowStockCount={lowStockCount}
        productsCount={products?.length || 0}
      />

      {/* Tabs */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All Batches
            </TabsTrigger>
            <TabsTrigger
              value="expiring"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Expiring Soon
            </TabsTrigger>
            <TabsTrigger
              value="lowStock"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Low Stock
            </TabsTrigger>
          </TabsList>

          <Button onClick={handleAddBatch} size="sm">
            <PackagePlus className="mr-2 h-4 w-4" />
            Add Batch
          </Button>
        </div>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <BatchFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            productFilter={productFilter}
            setProductFilter={setProductFilter}
            expiryFilter={expiryFilter}
            setExpiryFilter={setExpiryFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            resetFilters={resetFilters}
            products={products}
          />

          {/* Batches Table */}
          <BatchTable
            batches={tabFilteredBatches}
            products={products}
            isLoading={batchesLoading}
            error={batchesError}
            sortField={sortField}
            sortDirection={sortDirection}
            handleSort={handleSort}
            resetFilters={resetFilters}
            onEditBatch={handleEditBatch}
            onRecordTransaction={handleRecordTransaction}
            onViewHistory={handleViewHistory}
          />
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          <BatchTable
            batches={tabFilteredBatches}
            products={products}
            isLoading={batchesLoading}
            error={batchesError}
            sortField={sortField}
            sortDirection={sortDirection}
            handleSort={handleSort}
            resetFilters={resetFilters}
            onEditBatch={handleEditBatch}
            onRecordTransaction={handleRecordTransaction}
            onViewHistory={handleViewHistory}
          />
        </TabsContent>

        <TabsContent value="lowStock" className="space-y-4">
          <BatchTable
            batches={tabFilteredBatches}
            products={products}
            isLoading={batchesLoading}
            error={batchesError}
            sortField={sortField}
            sortDirection={sortDirection}
            handleSort={handleSort}
            resetFilters={resetFilters}
            onEditBatch={handleEditBatch}
            onRecordTransaction={handleRecordTransaction}
            onViewHistory={handleViewHistory}
          />
        </TabsContent>
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

      {isHistoryOpen && selectedBatch && (
        <BatchTransactionHistory
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          batchId={selectedBatch.id}
        />
      )}
    </div>
  );
}
