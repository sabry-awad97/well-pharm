import type { BatchItem } from '@/api/batch';
import type { InventoryItem } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowDownUp, Loader2, Package } from 'lucide-react';
import { BatchTableRow } from './BatchTableRow';

interface BatchTableProps {
  batches: BatchItem[];
  products?: InventoryItem[];
  isLoading: boolean;
  error: unknown;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  handleSort: (
    field: 'batchNumber' | 'productName' | 'quantity' | 'expiryDate',
  ) => void;
  resetFilters: () => void;
  onEditBatch: (batch: BatchItem) => void;
  onRecordTransaction: (batch: BatchItem) => void;
  onViewHistory: (batch: BatchItem) => void;
}

export function BatchTable({
  batches,
  products,
  isLoading,
  error,
  sortField,
  sortDirection,
  handleSort,
  resetFilters,
  onEditBatch,
  onRecordTransaction,
  onViewHistory,
}: BatchTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex h-[300px] flex-col items-center justify-center p-4 text-center">
            <AlertTriangle className="text-destructive h-8 w-8" />
            <h3 className="mt-2 text-lg font-medium">Error loading batches</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {error instanceof Error
                ? error.message
                : 'An unknown error occurred'}
            </p>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center p-4 text-center">
            <Package className="text-muted-foreground h-8 w-8" />
            <h3 className="mt-2 text-lg font-medium">No batches found</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              No batches match your current filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('batchNumber')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Batch Number</span>
                      {sortField === 'batchNumber' && (
                        <ArrowDownUp
                          className={cn(
                            'h-4 w-4',
                            sortDirection === 'desc' && 'rotate-180 transform',
                          )}
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('productName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Product</span>
                      {sortField === 'productName' && (
                        <ArrowDownUp
                          className={cn(
                            'h-4 w-4',
                            sortDirection === 'desc' && 'rotate-180 transform',
                          )}
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Quantity</span>
                      {sortField === 'quantity' && (
                        <ArrowDownUp
                          className={cn(
                            'h-4 w-4',
                            sortDirection === 'desc' && 'rotate-180 transform',
                          )}
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('expiryDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Expiry Date</span>
                      {sortField === 'expiryDate' && (
                        <ArrowDownUp
                          className={cn(
                            'h-4 w-4',
                            sortDirection === 'desc' && 'rotate-180 transform',
                          )}
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {batches.map((batch, index) => (
                    <BatchTableRow
                      key={batch.id}
                      batch={batch}
                      index={index}
                      products={products}
                      onEditBatch={onEditBatch}
                      onRecordTransaction={onRecordTransaction}
                      onViewHistory={onViewHistory}
                    />
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
