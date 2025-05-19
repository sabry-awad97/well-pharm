import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface SparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of numeric data points to visualize */
  data: number[];
  /** Height of the sparkline in pixels */
  height?: number;
  /** Width of the sparkline in pixels (defaults to 100% of container) */
  width?: number;
  /** Margin to apply to the visualization within the container */
  margin?: number;
  /** Optional minimum value for the y-axis (calculated from data if not provided) */
  min?: number;
  /** Optional maximum value for the y-axis (calculated from data if not provided) */
  max?: number;
  /** SVG preserveAspectRatio attribute value */
  preserveAspectRatio?: string;
  /** Enable smooth curve interpolation instead of straight lines */
  curve?: boolean;
  /** Enable animations when data changes */
  animate?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Labels for data points (used in tooltips) */
  labels?: string[];
  /** Format function for tooltip values */
  valueFormatter?: (value: number) => string;
}

interface SparklineChildProps {
  /** Array of calculated point coordinates */
  points: { x: number; y: number }[];
  /** Original data values */
  values: number[];
  /** Animation settings */
  animate?: boolean;
  /** Animation duration */
  animationDuration?: number;
}

interface SparklineLineProps extends React.SVGAttributes<SVGPathElement> {
  /** Line color */
  color?: string;
  /** Fill color (if area fill is desired) */
  fill?: string;
  /** Opacity of the fill area */
  fillOpacity?: number;
  /** Enable gradient fill that fades toward bottom */
  gradient?: boolean;
  /** Enable smooth curve interpolation */
  curve?: boolean;
  /** Line width */
  strokeWidth?: number;
}

interface SparklineSpotsProps extends React.SVGAttributes<SVGCircleElement> {
  /** Size of the spots */
  size?: number;
  /** Color of the spots */
  color?: string;
  /** Which points to highlight: 'all', 'min', 'max', 'first', 'last', or an array of indices */
  spotPoints?:
    | 'all'
    | 'min'
    | 'max'
    | 'first'
    | 'last'
    | Array<number>
    | Array<'min' | 'max' | 'first' | 'last'>;
  /** Show tooltips on hover */
  showTooltips?: boolean;
  /** Custom tooltip content renderer */
  tooltipFormatter?: (value: number, index: number) => React.ReactNode;
}

/**
 * Calculates a smooth curve through points using cardinal spline interpolation
 */
function getCurvedPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';

  // Use cardinal spline interpolation with tension 0.5
  const tension = 0.5;
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    // Calculate control points
    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

/**
 * Sparklines component for visualizing small, inline charts
 */
export const Sparklines = React.forwardRef<HTMLDivElement, SparklineProps>(
  (
    {
      data,
      height = 50,
      width,
      margin = 2,
      min,
      max,
      preserveAspectRatio = 'none',
      className,
      children,
      curve = false,
      animate = false,
      animationDuration = 500,
      labels,
      valueFormatter = value => value.toString(),
      ...props
    },
    ref,
  ) => {
    const dataPoints = React.useMemo(() => {
      if (!data || data.length === 0) return { points: [], values: [] };

      // Calculate min and max if not provided
      const dataMin = min !== undefined ? min : Math.min(...data);
      const dataMax = max !== undefined ? max : Math.max(...data);

      // Prevent division by zero
      const range = dataMax - dataMin || 1;

      // Calculate points with margins
      const points = data.map((value, index) => {
        const x = (index / (data.length - 1 || 1)) * 100;
        const y = 100 - ((value - dataMin) / range) * 100;
        return { x, y };
      });

      return { points, values: data };
    }, [data, min, max]);

    if (!data || data.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        style={{ height: `${height}px`, width: width ? `${width}px` : '100%' }}
        {...props}
      >
        <svg
          viewBox={'0 0 100 100'}
          preserveAspectRatio={preserveAspectRatio}
          className="h-full w-full"
        >
          <title>Sparkline Chart</title>
          {React.Children.map(children, child => {
            if (React.isValidElement<SparklineChildProps>(child)) {
              return React.cloneElement(child, {
                ...child.props,
                points: dataPoints.points,
                values: dataPoints.values,
                animate,
                animationDuration,
              });
            }
            return child;
          })}
        </svg>
      </div>
    );
  },
);

Sparklines.displayName = 'Sparklines';

/**
 * SparklinesLine component for rendering the line in a sparkline chart
 */
export const SparklinesLine = React.forwardRef<
  SVGPathElement,
  SparklineLineProps & {
    points?: { x: number; y: number }[];
    values?: number[];
    animate?: boolean;
    animationDuration?: number;
  }
>(
  (
    {
      points = [],
      values = [],
      color = 'hsl(var(--primary))',
      fill,
      fillOpacity = 0.1,
      gradient = false,
      curve = false,
      strokeWidth = 1.5,
      className,
      animate = false,
      animationDuration = 500,
      ...props
    },
    ref,
  ) => {
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [prevPoints, setPrevPoints] = React.useState<
      { x: number; y: number }[]
    >([]);
    const [currentPoints, setCurrentPoints] =
      React.useState<{ x: number; y: number }[]>(points);
    const gradientId = React.useId();

    React.useEffect(() => {
      if (animate && points.length > 0) {
        setPrevPoints(
          currentPoints.length
            ? currentPoints
            : points.map(pt => ({ x: pt.x, y: 100 })),
        );
        setIsAnimating(true);

        const timer = setTimeout(() => {
          setCurrentPoints(points);
          setIsAnimating(false);
        }, 50);

        return () => clearTimeout(timer);
      }
      setCurrentPoints(points);
    }, [points, animate, currentPoints]);

    if (!points || points.length === 0) {
      return null;
    }

    // Create the line path
    const displayPoints = isAnimating ? prevPoints : currentPoints;
    const linePath = curve
      ? getCurvedPath(displayPoints)
      : displayPoints
          .map(
            (point, index) =>
              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`,
          )
          .join(' ');

    // Create the fill path (if fill is enabled)
    const fillPath = fill
      ? curve
        ? `${getCurvedPath(displayPoints)} L ${displayPoints[displayPoints.length - 1].x} 100 L ${displayPoints[0].x} 100 Z`
        : `${linePath} L ${displayPoints[displayPoints.length - 1].x} 100 L ${displayPoints[0].x} 100 Z`
      : '';

    return (
      <>
        {gradient && fill && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={fill || color}
                stopOpacity={fillOpacity}
              />
              <stop offset="100%" stopColor={fill || color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}

        {fill && (
          <path
            d={fillPath}
            fill={gradient ? `url(#${gradientId})` : fill || color}
            fillOpacity={gradient ? 1 : fillOpacity}
            className={cn(
              'transition-all',
              animate ? `duration-${animationDuration}` : '',
              className,
            )}
          />
        )}

        <path
          ref={ref}
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            'transition-all',
            animate ? `duration-${animationDuration}` : '',
            className,
          )}
          {...props}
        />
      </>
    );
  },
);

SparklinesLine.displayName = 'SparklinesLine';

/**
 * SparklinesSpots component for highlighting specific data points
 */
export const SparklinesSpots = React.forwardRef<
  SVGGElement,
  SparklineSpotsProps & {
    points?: { x: number; y: number }[];
    values?: number[];
    animate?: boolean;
    animationDuration?: number;
  }
>(
  (
    {
      points = [],
      values = [],
      size = 3,
      color = 'hsl(var(--primary))',
      spotPoints = 'last',
      showTooltips = false,
      tooltipFormatter,
      className,
      animate = false,
      animationDuration = 500,
      ...props
    },
    ref,
  ) => {
    if (!points || points.length === 0) {
      return null;
    }

    // Determine which points to show
    const spotIndices: number[] = [];

    if (Array.isArray(spotPoints)) {
      // Handle array of numbers (indices)
      if (typeof spotPoints[0] === 'number') {
        spotIndices.push(
          ...(spotPoints as number[]).filter(i => i >= 0 && i < points.length),
        );
      }
      // Handle array of strings (special points)
      else {
        for (const spotType of spotPoints as Array<
          'min' | 'max' | 'first' | 'last'
        >) {
          if (spotType === 'first') spotIndices.push(0);
          if (spotType === 'last') spotIndices.push(points.length - 1);
          if (spotType === 'min') {
            const minValue = Math.min(...values);
            spotIndices.push(values.findIndex(v => v === minValue));
          }
          if (spotType === 'max') {
            const maxValue = Math.max(...values);
            spotIndices.push(values.findIndex(v => v === maxValue));
          }
        }
      }
    } else {
      // Handle string values
      if (spotPoints === 'all') {
        for (let i = 0; i < points.length; i++) spotIndices.push(i);
      }
      if (spotPoints === 'first') spotIndices.push(0);
      if (spotPoints === 'last') spotIndices.push(points.length - 1);
      if (spotPoints === 'min') {
        const minValue = Math.min(...values);
        spotIndices.push(values.findIndex(v => v === minValue));
      }
      if (spotPoints === 'max') {
        const maxValue = Math.max(...values);
        spotIndices.push(values.findIndex(v => v === maxValue));
      }
    }

    // Remove duplicates and ensure valid indices
    const uniqueIndices = [...new Set(spotIndices)].filter(
      i => i >= 0 && i < points.length,
    );

    return (
      <TooltipProvider>
        <g ref={ref}>
          {uniqueIndices.map(index => (
            <React.Fragment key={`spot-${index}`}>
              {showTooltips ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <circle
                      cx={points[index].x}
                      cy={points[index].y}
                      r={size}
                      fill={color}
                      className={cn(
                        'transition-all',
                        animate ? `duration-${animationDuration}` : '',
                        className,
                      )}
                      {...props}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {tooltipFormatter
                      ? tooltipFormatter(values[index], index)
                      : values[index]}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <circle
                  cx={points[index].x}
                  cy={points[index].y}
                  r={size}
                  fill={color}
                  className={cn(
                    'transition-all',
                    animate ? `duration-${animationDuration}` : '',
                    className,
                  )}
                  {...props}
                />
              )}
            </React.Fragment>
          ))}
        </g>
      </TooltipProvider>
    );
  },
);

SparklinesSpots.displayName = 'SparklinesSpots';

/**
 * SparklinesReferenceLine component for showing reference lines (like average, median, etc.)
 */
export const SparklinesReferenceLine = React.forwardRef<
  SVGLineElement,
  React.SVGAttributes<SVGLineElement> & {
    type?: 'min' | 'max' | 'mean' | 'avg' | 'median' | 'custom';
    value?: number;
    points?: { x: number; y: number }[];
    values?: number[];
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }
>(
  (
    {
      type = 'mean',
      value,
      points = [],
      values = [],
      color = 'rgba(0, 0, 0, 0.3)',
      strokeWidth = 1,
      strokeDasharray = '3, 3',
      className,
      ...props
    },
    ref,
  ) => {
    if (!points || points.length === 0) return null;

    let yValue: number;

    if (type === 'custom' && value !== undefined) {
      // Find where this value would be on the y-axis
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      yValue = 100 - ((value - min) / range) * 100;
    } else {
      let refValue: number;

      switch (type) {
        case 'min':
          refValue = Math.min(...values);
          break;
        case 'max':
          refValue = Math.max(...values);
          break;
        case 'median': {
          const sorted = [...values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          refValue =
            sorted.length % 2 === 0
              ? (sorted[mid - 1] + sorted[mid]) / 2
              : sorted[mid];
          break;
        }
        // case 'mean':
        // case 'avg':
        default:
          refValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
      }

      // Find the y position for this value
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      yValue = 100 - ((refValue - min) / range) * 100;
    }

    return (
      <line
        ref={ref}
        x1={0}
        y1={yValue}
        x2={100}
        y2={yValue}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        className={cn('transition-all', className)}
        {...props}
      />
    );
  },
);

SparklinesReferenceLine.displayName = 'SparklinesReferenceLine';
