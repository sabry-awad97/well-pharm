import { type BatchItem, useExpiringBatches } from '@/api/batch';
import { useGetProduct } from '@/api/product';
import { BatchTransactionForm } from '@/components/inventory/BatchTransactionForm';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function ExpiringBatchesPage() {
  const [daysThreshold, setDaysThreshold] = useState(30);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);

  const {
    data: expiringBatches,
    isLoading,
    error,
  } = useExpiringBatches(daysThreshold);

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    if (!Number.isNaN(value) && value > 0) {
      setDaysThreshold(value);
    }
  };

  const handleRecordTransaction = (batch: BatchItem) => {
    setSelectedBatch(batch);
    setIsTransactionFormOpen(true);
  };

  // const formatDate = (dateString: string | null | undefined) => {
  //   if (!dateString) return 'N/A';
  //   try {
  //     return format(new Date(dateString), 'MMM dd, yyyy');
  //   } catch (e) {
  //     return 'Invalid date';
  //   }
  // };

  // const getDaysUntilExpiry = (dateString: string | null | undefined) => {
  //   if (!dateString) return null;
  //   try {
  //     const expiryDate = new Date(dateString);
  //     const today = new Date();
  //     return Math.floor(
  //       (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  //     );
  //   } catch (e) {
  //     return null;
  //   }
  // };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Expiring Inventory"
        description="Manage products that will expire soon"
      />

      <Card>
        <CardHeader>
          <CardTitle>Expiry Threshold</CardTitle>
          <CardDescription>
            Show products expiring within the specified number of days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="daysThreshold">Days</Label>
              <Input
                id="daysThreshold"
                type="number"
                value={daysThreshold}
                onChange={handleDaysChange}
                min={1}
                max={365}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expiring Products</CardTitle>
          <CardDescription>
            {expiringBatches?.length || 0} products will expire within{' '}
            {daysThreshold} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-red-500">
              Error loading expiring batches:{' '}
              {error instanceof Error ? error.message : String(error)}
            </div>
          ) : expiringBatches && expiringBatches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringBatches.map(batch => (
                  <ExpiringBatchRow
                    key={batch.id}
                    batch={batch}
                    onRecordTransaction={handleRecordTransaction}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border p-4 text-center">
              No expiring batches found within {daysThreshold} days.
            </div>
          )}
        </CardContent>
      </Card>

      <BatchTransactionForm
        open={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        batch={selectedBatch}
      />
    </div>
  );
}

interface ExpiringBatchRowProps {
  batch: BatchItem;
  onRecordTransaction: (batch: BatchItem) => void;
}

function ExpiringBatchRow({
  batch,
  onRecordTransaction,
}: ExpiringBatchRowProps) {
  const { data: product } = useGetProduct(batch.productId);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

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

  const daysLeft = getDaysUntilExpiry(batch.expiryDate);

  return (
    <TableRow>
      <TableCell>{product?.name || 'Loading...'}</TableCell>
      <TableCell>{batch.batchNumber}</TableCell>
      <TableCell>{batch.quantity}</TableCell>
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
}
