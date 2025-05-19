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
import humanTime from 'humantime';
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { memo, useCallback } from 'react';
import { getPriorityColor, getStatusColor } from './utils';

/**
 * Props for the InventoryItemHeader component
 */
interface InventoryItemHeaderProps {
  /** The inventory item data */
  item: InventoryItem;
  /** Whether the item details are expanded */
  isExpanded: boolean;
}

/**
 * Header component for an inventory item showing name, priority badge, and stock percentage
 */
const InventoryItemHeader = memo(function InventoryItemHeader({
  item,
  isExpanded,
}: InventoryItemHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-0.5 h-5 w-5 p-0"
            aria-label={
              isExpanded ? 'Collapse item details' : 'Expand item details'
            }
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </CollapsibleTrigger>
        <div className="text-sm font-medium">{item.name}</div>
        {item.priority && (
          <Badge
            variant="outline"
            className={cn('h-5 py-0 text-xs', getPriorityColor(item.priority))}
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
                'text-sm font-semibold tabular-nums',
                getStatusColor(item.percentRemaining),
              )}
            >
              {item.percentRemaining}%
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">
              {item.stockLevel} of {item.threshold} units remaining
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});

/**
 * Props for the StockProgressBar component
 */
interface StockProgressBarProps {
  /** Percentage of stock remaining */
  percentRemaining: number;
}

/**
 * Progress bar component showing stock level with color coding
 */
const StockProgressBar = memo(function StockProgressBar({
  percentRemaining,
}: StockProgressBarProps) {
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <Progress
        value={percentRemaining}
        className={cn('h-1.5 flex-1', getStatusColor(percentRemaining))}
        aria-label={`Stock level: ${percentRemaining}%`}
      />
      {percentRemaining < 20 && (
        <AlertTriangle
          className="h-3.5 w-3.5 text-red-500"
          aria-label="Critical stock level"
        />
      )}
    </div>
  );
});

/**
 * Props for the StockHistoryChart component
 */
interface StockHistoryChartProps {
  /** Historical stock data */
  stockHistory?: number[];
  /** Percentage of stock remaining */
  percentRemaining: number;
}

/**
 * Chart component showing stock level history
 */
const StockHistoryChart = memo(function StockHistoryChart({
  stockHistory,
  percentRemaining,
}: StockHistoryChartProps) {
  if (!stockHistory || stockHistory.length === 0) return null;

  // Determine chart color based on current stock level
  const chartColor =
    percentRemaining < 20
      ? '#ef4444' // red
      : percentRemaining < 50
        ? '#f59e0b' // amber
        : '#10b981'; // emerald

  return (
    <div className="mt-2 h-10 w-full">
      <Sparklines data={stockHistory} height={36} margin={4}>
        <SparklinesLine color={chartColor} />
      </Sparklines>
    </div>
  );
});

/**
 * Props for the ItemDetailsGrid component
 */
interface ItemDetailsGridProps {
  /** The inventory item data */
  item: InventoryItem;
}

/**
 * Grid component showing detailed inventory item information
 */
const ItemDetailsGrid = memo(function ItemDetailsGrid({
  item,
}: ItemDetailsGridProps) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {item.category && (
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">Category:</span>
          <span className="text-right">{item.category}</span>
        </div>
      )}
      {item.supplier && (
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">Supplier:</span>
          <span className="text-right">{item.supplier}</span>
        </div>
      )}
      {item.lastOrdered && (
        <div className="flex justify-between">
          <span className="text-muted-foreground font-medium">
            Last ordered:
          </span>
          <span className="text-right">
            {humanTime(new Date(item.lastOrdered))}
          </span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground font-medium">Stock level:</span>
        <span className="text-right tabular-nums">
          {item.stockLevel} {item.unit || 'units'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground font-medium">Threshold:</span>
        <span className="text-right tabular-nums">
          {item.threshold} {item.unit || 'units'}
        </span>
      </div>
    </div>
  );
});
/**
 * Props for the ActionButtons component
 */
interface ActionButtonsProps {
  /** Whether the item is currently being reordered */
  isReordering: boolean;
  /** Handler for viewing item details */
  onViewDetails?: () => void;
  /** Handler for reordering the item */
  onReorder?: () => void;
}

/**
 * Component for action buttons (View Details, Reorder)
 */
const ActionButtons = memo(function ActionButtons({
  isReordering,
  onViewDetails,
  onReorder,
}: ActionButtonsProps) {
  return (
    <div className="mt-3 flex justify-end gap-2">
      {onViewDetails && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onViewDetails}
        >
          View Details
        </Button>
      )}
      {onReorder && (
        <Button
          variant="default"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onReorder}
          disabled={isReordering}
        >
          {isReordering ? (
            <RefreshCw
              className="mr-1 h-3 w-3 animate-spin"
              aria-hidden="true"
            />
          ) : null}
          Reorder
        </Button>
      )}
    </div>
  );
});

/**
 * Props for the InventoryItemComponent
 * @interface InventoryItemProps
 */
interface InventoryItemProps {
  /** The inventory item data */
  item: InventoryItem;
  /** Whether the item details are expanded */
  isExpanded: boolean;
  /** Whether the item is currently being reordered */
  isReordering: boolean;
  /** Handler for toggling the expanded state */
  onToggleExpand: (itemId: string) => void;
  /** Handler for reordering the item */
  onReorder?: (item: InventoryItem) => void;
  /** Handler for viewing item details */
  onViewDetails?: (itemId: string) => void;
}

/**
 * Component for displaying a single inventory item with expandable details
 *
 * This component shows an inventory item with its stock level, details,
 * and action buttons. It supports expanding/collapsing to show additional
 * information and provides actions for reordering and viewing details.
 */
export const InventoryItemComponent = memo(function InventoryItemComponent({
  item,
  isExpanded,
  isReordering,
  onToggleExpand,
  onReorder,
  onViewDetails,
}: InventoryItemProps) {
  // Memoized event handlers
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

  // Determine border color based on stock level for better visual hierarchy
  const borderColorClass =
    item.percentRemaining < 20
      ? 'border-red-200 dark:border-red-900/30'
      : item.percentRemaining < 50
        ? 'border-amber-200 dark:border-amber-900/30'
        : 'border-zinc-200 dark:border-zinc-800';

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={handleToggle}
      className={cn(
        'rounded-md border p-2.5 transition-all',
        borderColorClass,
        'hover:border-primary/20 hover:shadow-sm',
        isExpanded && 'bg-zinc-50/50 dark:bg-zinc-900/20',
      )}
    >
      <div className="space-y-0">
        {/* Header with name, priority badge, and percentage */}
        <InventoryItemHeader item={item} isExpanded={isExpanded} />

        {/* Progress bar with color coding */}
        <StockProgressBar percentRemaining={item.percentRemaining} />

        {/* Expanded content with details and actions */}
        <CollapsibleContent className="pt-1.5">
          {/* Stock history chart */}
          <StockHistoryChart
            stockHistory={item.stockHistory}
            percentRemaining={item.percentRemaining}
          />

          {/* Item details grid */}
          <ItemDetailsGrid item={item} />

          {/* Action buttons */}
          <ActionButtons
            isReordering={isReordering}
            onViewDetails={onViewDetails ? handleViewDetails : undefined}
            onReorder={onReorder ? handleReorder : undefined}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
