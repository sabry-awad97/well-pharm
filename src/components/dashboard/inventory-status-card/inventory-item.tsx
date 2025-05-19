import type { InventoryItem } from '@/api/dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import {
  Sparklines,
  SparklinesLine,
  SparklinesReferenceLine,
  SparklinesSpots,
} from '@/components/ui/sparklines';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
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
  stockHistory?: number[] | null;
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

  // Format stock values for tooltips
  const formatStockValue = (value: number) => `Stock level: ${value} units`;

  return (
    <div
      className="mt-2 h-10 w-full"
      aria-label={`Stock history chart showing trend from ${stockHistory[0]} to ${stockHistory[stockHistory.length - 1]} units`}
    >
      <Sparklines
        data={stockHistory}
        height={36}
        margin={4}
        animate={true}
        animationDuration={700}
      >
        <SparklinesLine
          color={chartColor}
          fill={chartColor}
          fillOpacity={0.15}
          gradient={true}
          curve={true}
          strokeWidth={1.8}
        />
        <SparklinesSpots
          color={chartColor}
          size={2.5}
          spotPoints={['min', 'max', 'last']}
          showTooltips={true}
          tooltipFormatter={formatStockValue}
        />
        <SparklinesReferenceLine
          type="mean"
          color={chartColor}
          strokeWidth={0.8}
          strokeDasharray="2, 2"
        />
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
  // Determine if stock level is critical (below threshold)
  const isStockCritical = item.stockLevel < item.threshold * 0.2;

  return (
    <div className="mt-3 rounded-sm bg-zinc-50/70 p-2.5 dark:bg-zinc-900/30">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {/* Category */}
        {item.category && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground min-w-[80px] font-medium">
              Category:
            </span>
            <span className="truncate font-normal">{item.category}</span>
          </div>
        )}

        {/* Supplier */}
        {item.supplier && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground min-w-[80px] font-medium">
              Supplier:
            </span>
            <span className="truncate font-normal">{item.supplier}</span>
          </div>
        )}

        {/* Last ordered */}
        {item.lastOrdered && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground min-w-[80px] font-medium">
              Last ordered:
            </span>
            <span className="font-normal">{item.lastOrdered}</span>
          </div>
        )}

        {/* Stock level */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground min-w-[80px] font-medium">
            Stock level:
          </span>
          <span
            className={cn(
              'font-medium tabular-nums',
              isStockCritical ? 'text-red-500 dark:text-red-400' : '',
            )}
          >
            {item.stockLevel} {item.unit || 'units'}
          </span>
        </div>

        {/* Threshold */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground min-w-[80px] font-medium">
            Threshold:
          </span>
          <span className="font-medium tabular-nums">
            {item.threshold} {item.unit || 'units'}
          </span>
        </div>

        {/* Reorder amount - if available */}
        {item.reorderAmount && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground min-w-[80px] font-medium">
              Reorder qty:
            </span>
            <span className="font-medium tabular-nums">
              {item.reorderAmount} {item.unit || 'units'}
            </span>
          </div>
        )}
      </div>

      {/* Optional: Add a divider and additional information section */}
      {(item.notes || item.expiryDate) && (
        <>
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-700" />
          <div className="grid grid-cols-1 gap-y-2 text-xs">
            {/* Expiry date - if available */}
            {item.expiryDate && (
              <div className="flex items-start gap-1.5">
                <span className="text-muted-foreground min-w-[80px] font-medium">
                  Expires:
                </span>
                <span className="font-normal">{item.expiryDate}</span>
              </div>
            )}

            {/* Notes - if available */}
            {item.notes && (
              <div className="flex items-start gap-1.5">
                <span className="text-muted-foreground min-w-[80px] font-medium">
                  Notes:
                </span>
                <span className="font-normal italic">{item.notes}</span>
              </div>
            )}
          </div>
        </>
      )}
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
