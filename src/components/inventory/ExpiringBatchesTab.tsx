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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ExpiringBatchesTabProps {
  batches: BatchItem[];
  products?: InventoryItem[];
  isLoading: boolean;
  onRecordTransaction: (batch: BatchItem) => void;
}

export function ExpiringBatchesTab({
  batches,
  products,
  isLoading,
  onRecordTransaction,
}: ExpiringBatchesTabProps) {
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const expiryDate = new Date(dateString);
      const today = new Date();
      return Math.floor(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
    } catch (e) {
      return null;
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
            <AlertTriangle className="text-muted-foreground h-8 w-8" />
            <h3 className="mt-2 text-lg font-medium">No expiring batches</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              No batches are expiring within the next 30 days.
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
                  <TableHead>Days Left</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map(batch => {
                  const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                  return (
                    <TableRow
                      key={batch.id}
                      className={cn(
                        'hover:bg-muted/50 border-b transition-colors',
                        daysLeft !== null &&
                          daysLeft <= 7 &&
                          'bg-red-50 dark:bg-red-950/10',
                      )}
                    >
                      <TableCell className="font-medium">
                        {batch.batchNumber}
                      </TableCell>
                      <TableCell>
                        {products?.find(p => p.id === batch.productId)?.name ||
                          'Unknown Product'}
                      </TableCell>
                      <TableCell className="text-right">
                        {batch.quantity}
                      </TableCell>
                      <TableCell>{formatDate(batch.expiryDate)}</TableCell>
                      <TableCell>
                        {daysLeft !== null && (
                          <div className="flex items-center">
                            {daysLeft <= 7 && (
                              <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                            )}
                            {daysLeft} days
                          </div>
                        )}
                      </TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
