import { type BatchItem, useListBatchesByProduct } from '@/api/batch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  Loader2,
  Plus,
} from 'lucide-react';
import { useState } from 'react';

interface BatchListProps {
  productId: string;
  onAddBatch: () => void;
  onEditBatch: (batch: BatchItem) => void;
  onRecordTransaction: (batch: BatchItem) => void;
}

export function BatchList({
  productId,
  onAddBatch,
  onEditBatch,
  onRecordTransaction,
}: BatchListProps) {
  const {
    data: batches,
    isLoading,
    error,
  } = useListBatchesByProduct(productId);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading batches:{' '}
        {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }

  const handleTransactionClick = (batch: BatchItem) => {
    setSelectedBatch(batch);
    setIsDialogOpen(true);
  };

  const handleTransactionConfirm = (_type: 'add' | 'remove') => {
    if (selectedBatch) {
      onRecordTransaction(selectedBatch);
      setIsDialogOpen(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const isExpiringSoon = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    try {
      const expiryDate = new Date(dateString);
      const today = new Date();
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Batch Inventory</h3>
        <Button onClick={onAddBatch} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Batch
        </Button>
      </div>

      {batches && batches.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Purchase Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map(batch => (
              <TableRow key={batch.id}>
                <TableCell>{batch.batchNumber}</TableCell>
                <TableCell>{batch.quantity}</TableCell>
                <TableCell>
                  {isExpiringSoon(batch.expiryDate) ? (
                    <Badge variant="destructive">
                      {formatDate(batch.expiryDate)}
                    </Badge>
                  ) : (
                    formatDate(batch.expiryDate)
                  )}
                </TableCell>
                <TableCell>${batch.purchasePrice.toFixed(2)}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEditBatch(batch)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleTransactionClick(batch)}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-md border p-4 text-center">
          No batches found for this product.
        </div>
      )}

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record Batch Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a transaction type for batch {selectedBatch?.batchNumber}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleTransactionConfirm('add')}
              className="mr-2"
            >
              <ArrowUp className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
            <AlertDialogAction
              onClick={() => handleTransactionConfirm('remove')}
            >
              <ArrowDown className="mr-2 h-4 w-4" />
              Remove Stock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
