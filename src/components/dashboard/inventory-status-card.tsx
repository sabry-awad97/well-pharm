import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';
import { DashboardCard } from './dashboard-card';

interface InventoryItem {
  id: string;
  name: string;
  stockLevel: number;
  threshold: number;
  percentRemaining: number;
}

interface InventoryStatusCardProps {
  lowStockItems?: InventoryItem[];
}

export function InventoryStatusCard({
  lowStockItems,
}: InventoryStatusCardProps) {
  const isEmpty = !lowStockItems || lowStockItems.length === 0;

  return (
    <DashboardCard
      title="Inventory Status"
      description="Low stock items that need attention"
      className="col-span-3"
      isEmpty={isEmpty}
      emptyState={
        <div className="text-center">
          <Package className="text-muted-foreground/50 mx-auto h-8 w-8" />
          <p className="text-muted-foreground mt-2 text-sm">
            No low stock items
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        {lowStockItems?.map(item => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium">{item.name}</div>
              <div className="text-muted-foreground">
                {item.percentRemaining}%
              </div>
            </div>
            <Progress
              value={item.percentRemaining}
              className={cn(
                'h-2',
                item.percentRemaining < 20
                  ? 'text-red-500'
                  : item.percentRemaining < 50
                    ? 'text-amber-500'
                    : 'text-emerald-500',
              )}
            />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
