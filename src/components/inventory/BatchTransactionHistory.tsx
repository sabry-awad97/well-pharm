import { useGetBatch, useListBatchTransactions } from '@/api/batch';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

interface BatchTransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
}

export function BatchTransactionHistory({
  open,
  onOpenChange,
  batchId,
}: BatchTransactionHistoryProps) {
  const { data: batch } = useGetBatch(batchId);
  const {
    data: transactions,
    isLoading,
    error,
  } = useListBatchTransactions(batchId);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
          <DialogDescription>
            {batch
              ? `Transaction history for batch ${batch.batchNumber}`
              : 'Loading batch information...'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex h-[200px] flex-col items-center justify-center p-4 text-center">
              <AlertTriangle className="text-destructive h-8 w-8" />
              <h3 className="mt-2 text-lg font-medium">
                Error loading transactions
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {error instanceof Error
                  ? error.message
                  : 'An unknown error occurred'}
              </p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {transaction.transactionType === 'add' ? (
                          <>
                            <ArrowUpRight className="mr-2 h-4 w-4 text-green-500" />
                            <span>Stock In</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="mr-2 h-4 w-4 text-red-500" />
                            <span>Stock Out</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {transaction.quantity > 0 ? '+' : ''}
                      {transaction.quantity}
                    </TableCell>
                    <TableCell>{transaction.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-md border p-4 text-center">
              No transaction records found for this batch.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
