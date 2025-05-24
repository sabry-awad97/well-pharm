import type { BatchItem } from '@/api/batch';
import type { InventoryItem } from '@/api/inventory';
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
import { cn } from '@/lib/utils';
import { Eye, Loader2, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  onAddBatch: (productId: string) => void;
  onEditBatch: (batch: BatchItem) => void;
  onRecordTransaction: (batch: BatchItem) => void;
}

export function InventoryTable({
  items,
  isLoading,
  onAddBatch,
}: InventoryTableProps) {
  const handleViewProduct = (_productId: string) => {
    toast.info('Product details feature coming soon', {
      description: 'This functionality will be available in a future update.',
    });
  };

  // Enhanced stock level indicator with better visual design
  const getStockLevelInfo = (item: InventoryItem) => {
    const stockLevel = item.stockLevel || 0;
    const threshold = item.threshold || 20;
    const maxStock = Math.max(stockLevel, threshold * 2);
    const percentage = Math.min(Math.round((stockLevel / maxStock) * 100), 100);

    let colorClass = '';
    let statusText = '';

    if (stockLevel === 0) {
      colorClass = 'bg-red-500';
      statusText = 'Out of stock';
    } else if (stockLevel < threshold) {
      colorClass = 'bg-amber-500';
      statusText = 'Low stock';
    } else {
      colorClass = 'bg-green-500';
      statusText = 'In stock';
    }

    return { percentage, colorClass, statusText };
  };

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-md border border-dashed p-8 text-center">
        <Package className="text-muted-foreground h-12 w-12" />
        <div>
          <h3 className="text-lg font-medium">No inventory items found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your filters or add new products to your inventory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-medium">Product</TableHead>
            <TableHead className="font-medium">Category</TableHead>
            <TableHead className="font-medium">Stock Level</TableHead>
            <TableHead className="font-medium">Price</TableHead>
            <TableHead className="text-right font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => {
            const { percentage, colorClass, statusText } =
              getStockLevelInfo(item);

            return (
              <TableRow key={item.id} className="h-16">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  {item.category ? (
                    <Badge variant="outline" className="font-normal">
                      {item.category}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Uncategorized
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="w-full max-w-[180px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {item.stockLevel || 0}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {statusText}
                      </span>
                    </div>
                    <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={cn(
                          'absolute inset-y-0 left-0 transition-all',
                          colorClass,
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      ${item.sellingPrice?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Cost: ${item.purchasePrice?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewProduct(item.id)}
                      title="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onAddBatch(item.id)}
                      title="Add batch"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
