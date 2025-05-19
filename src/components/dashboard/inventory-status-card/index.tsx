import type { InventoryItem } from '@/api/dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparklines, SparklinesLine } from '@/components/ui/sparklines';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DashboardCard } from '../dashboard-card';

// Sort options for inventory items
type SortOption = 'name' | 'percentRemaining' | 'priority';

interface InventoryStatusCardProps {
  lowStockItems?: InventoryItem[];
  onReorder?: (itemId: string, amount: number) => Promise<void>;
  onViewDetails?: (itemId: string) => void;
}

export function InventoryStatusCard({
  lowStockItems,
  onReorder,
  onViewDetails,
}: InventoryStatusCardProps) {
  const isEmpty = !lowStockItems || lowStockItems.length === 0;

  // Local state for UI interactions
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [sortBy, setSortBy] = useState<SortOption>('percentRemaining');
  const [filterText, setFilterText] = useState('');
  const [isReordering, setIsReordering] = useState<Record<string, boolean>>({});

  // Toggle expanded state for an item
  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Handle reorder action
  const handleReorder = async (item: InventoryItem) => {
    if (!onReorder) return;

    setIsReordering(prev => ({ ...prev, [item.id]: true }));
    try {
      await onReorder(
        item.id,
        item.reorderAmount || Math.max(item.threshold - item.stockLevel, 1),
      );
    } finally {
      setIsReordering(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Filter and sort items based on current state
  const processedItems = useMemo(() => {
    if (!lowStockItems) return [];

    return lowStockItems
      .filter(
        item =>
          item.name.toLowerCase().includes(filterText.toLowerCase()) ||
          item.category?.toLowerCase().includes(filterText.toLowerCase()) ||
          item.supplier?.toLowerCase().includes(filterText.toLowerCase()),
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'percentRemaining':
            return a.percentRemaining - b.percentRemaining;
          case 'priority': {
            const priorityValues = { high: 0, medium: 1, low: 2 };
            return (
              (priorityValues[a.priority || 'low'] || 0) -
              (priorityValues[b.priority || 'low'] || 0)
            );
          }
          default:
            return 0;
        }
      });
  }, [lowStockItems, sortBy, filterText]);

  // Get status color based on percentage
  const getStatusColor = (percent: number) => {
    if (percent < 20) return 'text-red-500';
    if (percent < 50) return 'text-amber-500';
    return 'text-emerald-500';
  };

  // Get priority badge color
  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      case 'low':
        return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20';
    }
  };

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
      {!isEmpty && (
        <div className="space-y-4">
          {/* Controls for sorting and filtering */}
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search items..."
                className="pl-8"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={value => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentRemaining">Stock Level</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items list */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 pr-4">
              {processedItems.map(item => (
                <Collapsible
                  key={item.id}
                  open={expandedItems[item.id]}
                  onOpenChange={() => toggleExpand(item.id)}
                  className="border-border hover:border-primary/20 rounded-md border p-3 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            {expandedItems[item.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <div className="font-medium">{item.name}</div>
                        {item.priority && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'ml-2',
                              getPriorityColor(item.priority),
                            )}
                          >
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'text-muted-foreground font-medium',
                                getStatusColor(item.percentRemaining),
                              )}
                            >
                              {item.percentRemaining}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {item.stockLevel} of {item.threshold} units
                              remaining
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Progress bar with color coding */}
                    <div className="flex items-center gap-2">
                      <Progress
                        value={item.percentRemaining}
                        className={cn(
                          'h-2 flex-1',
                          getStatusColor(item.percentRemaining),
                        )}
                      />
                      {item.percentRemaining < 20 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>

                    {/* Expanded content with details and actions */}
                    <CollapsibleContent className="space-y-3 pt-2">
                      {item.stockHistory && item.stockHistory.length > 0 && (
                        <div className="h-12 w-full">
                          <Sparklines
                            data={item.stockHistory}
                            height={40}
                            margin={5}
                          >
                            <SparklinesLine
                              color={
                                item.percentRemaining < 20
                                  ? '#ef4444'
                                  : item.percentRemaining < 50
                                    ? '#f59e0b'
                                    : '#10b981'
                              }
                            />
                          </Sparklines>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {item.category && (
                          <div>
                            <span className="text-muted-foreground">
                              Category:
                            </span>{' '}
                            {item.category}
                          </div>
                        )}
                        {item.supplier && (
                          <div>
                            <span className="text-muted-foreground">
                              Supplier:
                            </span>{' '}
                            {item.supplier}
                          </div>
                        )}
                        {item.lastOrdered && (
                          <div>
                            <span className="text-muted-foreground">
                              Last ordered:
                            </span>{' '}
                            {item.lastOrdered}
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">
                            Stock level:
                          </span>{' '}
                          {item.stockLevel} {item.unit || 'units'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Threshold:
                          </span>{' '}
                          {item.threshold} {item.unit || 'units'}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        {onViewDetails && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails(item.id)}
                          >
                            View Details
                          </Button>
                        )}
                        {onReorder && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleReorder(item)}
                            disabled={isReordering[item.id]}
                          >
                            {isReordering[item.id] ? (
                              <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                            ) : null}
                            Reorder
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </DashboardCard>
  );
}

