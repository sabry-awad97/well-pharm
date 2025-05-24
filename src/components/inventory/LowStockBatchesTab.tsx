import type { BatchItem } from '@/api/batch';
import type { InventoryItem } from '@/api/inventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Loader2, Package } from 'lucide-react';

interface LowStockBatchesTabProps {
  batches: BatchItem[];
  products?: InventoryItem[];
  isLoading: boolean;
  onRecordTransaction: (batch: BatchItem) => void;
}

export function LowStockBatchesTab({
  batches,
  products,
  isLoading,
  onRecordTransaction,
}: LowStockBatchesTabProps) {
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : batches.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center p-4 text-center">
            <Package className="text-muted-foreground h-8 w-8" />
            <h3 className="mt-2 text-lg font-medium">No low stock batches</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              All batches have sufficient stock levels.
            </p>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map(batch => (
                  <TableRow
                    key={batch.id}
                    className="hover:bg-muted/50 border-b transition-colors"
                  >
                    <TableCell className="font-medium">
                      {batch.batchNumber}
                    </TableCell>
                    <TableCell>
                      {products?.find(p => p.id === batch.productId)?.name ||
                        'Unknown Product'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                      {batch.quantity}
                    </TableCell>
                    <TableCell>{formatDate(batch.expiryDate)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRecordTransaction(batch)}
                      >
                        Manage Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
