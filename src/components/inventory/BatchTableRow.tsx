import type { BatchItem } from '@/api/batch';
import type { InventoryItem } from '@/api/inventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';

interface BatchTableRowProps {
  batch: BatchItem;
  index: number;
  products?: InventoryItem[];
  onEditBatch: (batch: BatchItem) => void;
  onRecordTransaction: (batch: BatchItem) => void;
  onViewHistory: (batch: BatchItem) => void;
}

export function BatchTableRow({
  batch,
  index,
  products,
  onEditBatch,
  onRecordTransaction,
  onViewHistory,
}: BatchTableRowProps) {
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

  // Get expiry status badge
  const getExpiryBadge = (dateString: string | null | undefined) => {
    if (!dateString) return null;

    const daysLeft = getDaysUntilExpiry(dateString);

    if (daysLeft === null) return null;

    if (daysLeft < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (daysLeft <= 7) {
      return <Badge variant="destructive">Critical: {daysLeft} days</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge variant="warning">Warning: {daysLeft} days</Badge>;
    }
    if (daysLeft <= 90) {
      return <Badge variant="outline">Expiring: {daysLeft} days</Badge>;
    }

    return null;
  };

  return (
    <motion.tr
      key={batch.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={cn(
        'hover:bg-muted/50 border-b transition-colors',
        batch.quantity < 10 && 'bg-red-50 dark:bg-red-950/10',
      )}
    >
      <TableCell className="font-medium">{batch.batchNumber}</TableCell>
      <TableCell>
        {products?.find(p => p.id === batch.productId)?.name ||
          'Unknown Product'}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            'font-medium',
            batch.quantity < 10 && 'text-red-600 dark:text-red-400',
          )}
        >
          {batch.quantity}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col space-y-1">
          <span>{formatDate(batch.expiryDate)}</span>
          {getExpiryBadge(batch.expiryDate)}
        </div>
      </TableCell>
      <TableCell>${batch.purchasePrice.toFixed(2)}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditBatch(batch)}>
              Edit Batch
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRecordTransaction(batch)}>
              Adjust Stock
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewHistory(batch)}>
              View History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  );
}
