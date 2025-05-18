import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type Variants, motion } from 'framer-motion';
import { AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';
import {
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

// Lazy load the sparkline component
const LazySparkline = lazy(() => import('./sparkline-component'));

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
  // New props for enhanced features
  detailedInfo?: React.ReactNode;
  historicalData?: Array<{ value: number }>;
}

const SummaryItem = memo(function SummaryItem({
  label,
  value,
  tooltipContent,
  itemVariants,
  isPercentageChange = false,
  percentageChangeValue = 0,
  isCritical = false,
  statusIndicator,
  detailedInfo,
  historicalData,
}: SummaryItemProps) {
  // State for expanded view
  const [isExpanded, setIsExpanded] = useState(false);

  // Track previous value for animation
  const [prevValue, setPrevValue] = useState(value);
  const [isValueChanging, setIsValueChanging] = useState(false);

  // Add responsive layout detection
  const [isMobile, setIsMobile] = useState(false);

  // Add ref for keyboard focus
  const itemRef = useRef<HTMLDivElement>(null);

  // Detect value changes
  useEffect(() => {
    if (value !== prevValue && prevValue !== undefined) {
      setIsValueChanging(true);
      const timer = setTimeout(() => {
        setIsValueChanging(false);
        setPrevValue(value);
      }, 600);
      return () => clearTimeout(timer);
    }
    setPrevValue(value);
  }, [value, prevValue]);

  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle keyboard interaction
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsExpanded(prev => !prev);
    }
  }, []);

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
    <div>
      <Tooltip delayDuration={isMobile ? 300 : 0}>
        <TooltipTrigger asChild>
          <motion.div
            ref={itemRef}
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            animate="animate"
            className={cn(
              'relative cursor-help rounded-md p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
              'border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700',
              'flex flex-col gap-0.5',
              isMobile ? 'min-w-[60px]' : 'min-w-[80px]',
              detailedInfo && 'cursor-pointer',
            )}
            tabIndex={0}
            aria-label={`${label}: ${isPercentageChange ? `${percentageChangeValue.toFixed(1)}%` : value}`}
            aria-describedby={`tooltip-${label.replace(/\s+/g, '-').toLowerCase()}`}
            aria-expanded={isExpanded}
            onClick={() => detailedInfo && setIsExpanded(prev => !prev)}
            onKeyDown={handleKeyDown}
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
              <p
                className={cn(
                  'font-medium text-zinc-500 dark:text-zinc-400',
                  isMobile ? 'text-[9px]' : 'text-[10px]',
                )}
              >
                {label}
              </p>

              {/* Render value based on whether it's percentage change */}
              {isPercentageChange ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <motion.p
                      className={cn(
                        'font-bold tracking-tight',
                        valueColorClass,
                        isMobile ? 'text-xs' : 'text-sm',
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
                    'font-bold tracking-tight',
                    valueColorClass,
                    isMobile ? 'text-xs' : 'text-sm',
                    isValueChanging
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-zinc-900 dark:text-zinc-50',
                  )}
                  variants={hoverAnimationVariants}
                  animate={isValueChanging ? 'changing' : 'initial'}
                >
                  {value}
                </motion.p>
              )}

              {/* Add sparkline if historical data exists */}
              {historicalData && historicalData.length > 1 && (
                <div className="mt-1 h-8 w-full">
                  <Suspense
                    fallback={
                      <div className="h-8 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    }
                  >
                    <LazySparkline
                      data={historicalData}
                      color={percentageChangeValue >= 0 ? '#10b981' : '#ef4444'}
                    />
                  </Suspense>
                </div>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent
          id={`tooltip-${label.replace(/\s+/g, '-').toLowerCase()}`}
          className="border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-50 dark:bg-zinc-800"
          sideOffset={4}
        >
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>

      {/* Expandable details panel */}
      {detailedInfo && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={
            isExpanded
              ? { height: 'auto', opacity: 1 }
              : { height: 0, opacity: 0 }
          }
          className="mt-1 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
        >
          <div className="p-2 text-xs">{detailedInfo}</div>
        </motion.div>
      )}
    </div>
  );
});

export default SummaryItem;
