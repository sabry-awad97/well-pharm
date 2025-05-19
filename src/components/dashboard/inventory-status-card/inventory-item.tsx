import type { InventoryItem } from '@/api/dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Sparklines, SparklinesLine } from '@/components/ui/sparklines';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useCallback } from 'react';
import { getPriorityColor, getStatusColor } from './utils';

interface InventoryItemProps {
  item: InventoryItem;
  isExpanded: boolean;
  isReordering: boolean;
  onToggleExpand: (itemId: string) => void;
  onReorder?: (item: InventoryItem) => void;
  onViewDetails?: (itemId: string) => void;
}

/**
 * Component for displaying a single inventory item
 */
export function InventoryItemComponent({
  item,
  isExpanded,
  isReordering,
  onToggleExpand,
  onReorder,
  onViewDetails,
}: InventoryItemProps) {
  const handleToggle = useCallback(() => {
    onToggleExpand(item.id);
  }, [item.id, onToggleExpand]);

  const handleReorder = useCallback(() => {
    if (onReorder) {
      onReorder(item);
    }
  }, [item, onReorder]);

  const handleViewDetails = useCallback(() => {
    if (onViewDetails) {
      onViewDetails(item.id);
    }
  }, [item.id, onViewDetails]);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={handleToggle}
      className="border-border hover:border-primary/20 rounded-md border p-3 transition-all"
    >
      <div className="space-y-2">
        {/* Header with name, priority badge, and percentage */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                aria-label={
                  isExpanded ? 'Collapse item details' : 'Expand item details'
                }
              >
                {isExpanded ? (
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
                className={cn('ml-2', getPriorityColor(item.priority))}
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
                  {item.stockLevel} of {item.threshold} units remaining
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress bar with color coding */}
        <div className="flex items-center gap-2">
          <Progress
            value={item.percentRemaining}
            className={cn('h-2 flex-1', getStatusColor(item.percentRemaining))}
            aria-label={`Stock level: ${item.percentRemaining}%`}
          />
          {item.percentRemaining < 20 && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>

        {/* Expanded content with details and actions */}
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Stock history chart */}
          {item.stockHistory && item.stockHistory.length > 0 && (
            <div className="h-12 w-full">
              <Sparklines data={item.stockHistory} height={40} margin={5}>
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

          {/* Item details grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {item.category && (
              <div>
                <span className="text-muted-foreground">Category:</span>{' '}
                {item.category}
              </div>
            )}
            {item.supplier && (
              <div>
                <span className="text-muted-foreground">Supplier:</span>{' '}
                {item.supplier}
              </div>
            )}
            {item.lastOrdered && (
              <div>
                <span className="text-muted-foreground">Last ordered:</span>{' '}
                {item.lastOrdered}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Stock level:</span>{' '}
              {item.stockLevel} {item.unit || 'units'}
            </div>
            <div>
              <span className="text-muted-foreground">Threshold:</span>{' '}
              {item.threshold} {item.unit || 'units'}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-1">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={handleViewDetails}>
                View Details
              </Button>
            )}
            {onReorder && (
              <Button
                variant="default"
                size="sm"
                onClick={handleReorder}
                disabled={isReordering}
              >
                {isReordering ? (
                  <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                Reorder
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
