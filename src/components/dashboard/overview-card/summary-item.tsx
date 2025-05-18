import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type Variants, motion } from 'framer-motion';
import { AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';

interface SummaryItemProps {
  label: string;
  value?: React.ReactNode; // Made the value prop optional
  tooltipContent: string;
  itemVariants: Variants; // Framer Motion variants for animation
  // Optional props for percentage change specific rendering
  isPercentageChange?: boolean;
  percentageChangeValue?: number; // The raw number for percentage change
  isCritical?: boolean; // New prop for critical values
  statusIndicator?: 'success' | 'warning' | 'error' | 'info'; // Optional status indicator
}

function SummaryItem({
  label,
  value,
  tooltipContent,
  itemVariants,
  isPercentageChange = false,
  percentageChangeValue = 0,
  isCritical = false,
  statusIndicator,
}: SummaryItemProps) {
  // Determine the text color based on percentage change if applicable
  const valueColorClass = isPercentageChange
    ? percentageChangeValue >= 0
      ? 'text-emerald-600 dark:text-emerald-500'
      : 'text-red-600 dark:text-red-500'
    : ''; // No specific color class for other items

  // Status indicator colors
  const statusColors = {
    success:
      'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    warning:
      'bg-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    error: 'bg-red-500/20 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    info: 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  };

  // Progress bar colors for percentage
  const progressColor =
    percentageChangeValue >= 0
      ? 'bg-emerald-500/30 dark:bg-emerald-500/20'
      : 'bg-red-500/30 dark:bg-red-500/20';

  // Calculate progress width (capped between 0-100%)
  const progressWidth = Math.min(Math.abs(percentageChangeValue), 100);

  // Hover animation variants
  const hoverAnimationVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  // Trend indicator animation variants
  const trendIndicatorVariants = {
    initial: { opacity: 0, y: percentageChangeValue >= 0 ? 5 : -5 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <motion.div
          variants={itemVariants}
          initial="initial"
          whileHover="hover"
          animate="animate"
          className={cn(
            'relative cursor-help rounded-md p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
            'border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700',
            'flex min-w-[80px] flex-col gap-0.5',
          )}
        >
          {/* Status indicator dot */}
          {statusIndicator && (
            <div
              className={cn(
                'absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full',
                statusColors[statusIndicator],
              )}
            />
          )}

          {/* Critical badge */}
          {isCritical && (
            <div className="absolute -top-1 -right-1">
              <Badge
                variant="destructive"
                className="flex h-3 items-center px-1 py-0 text-[8px]"
              >
                <AlertCircle className="mr-0.5 h-2 w-2" />
                Critical
              </Badge>
            </div>
          )}

          <div className="flex flex-col">
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              {label}
            </p>

            {/* Render value based on whether it's percentage change */}
            {isPercentageChange ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <motion.p
                    className={cn(
                      'text-sm font-bold tracking-tight',
                      valueColorClass,
                    )}
                    variants={hoverAnimationVariants}
                  >
                    {percentageChangeValue.toFixed(1)}%
                  </motion.p>
                  {percentageChangeValue !== 0 && (
                    <motion.span
                      className={cn(
                        'flex items-center text-[10px]',
                        valueColorClass,
                      )}
                      variants={trendIndicatorVariants}
                    >
                      {percentageChangeValue > 0 ? (
                        <ArrowUp className="h-2.5 w-2.5" />
                      ) : (
                        <ArrowDown className="h-2.5 w-2.5" />
                      )}
                    </motion.span>
                  )}
                </div>

                {/* Progress bar for percentage */}
                <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <motion.div
                    className={cn('h-full rounded-full', progressColor)}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressWidth}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ) : (
              <motion.p
                className={cn(
                  'text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50',
                  valueColorClass,
                )}
                variants={hoverAnimationVariants}
              >
                {value}
              </motion.p>
            )}
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent
        className="border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-50 dark:bg-zinc-800"
        sideOffset={4}
      >
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default SummaryItem;
