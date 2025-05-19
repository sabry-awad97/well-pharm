import { cn } from '@/lib/utils';
import * as React from 'react';

interface SparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  data: number[];
  height?: number;
  width?: number;
  margin?: number;
  min?: number;
  max?: number;
  preserveAspectRatio?: string;
}

interface SparklineChildProps {
  points: { x: number; y: number }[];
}

interface SparklineLineProps extends React.SVGAttributes<SVGPathElement> {
  color?: string;
  fill?: string;
  fillOpacity?: number;
}

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
      ...props
    },
    ref,
  ) => {
    const dataPoints = React.useMemo(() => {
      if (!data || data.length === 0) return [];

      // Calculate min and max if not provided
      const dataMin = min !== undefined ? min : Math.min(...data);
      const dataMax = max !== undefined ? max : Math.max(...data);

      // Prevent division by zero
      const range = dataMax - dataMin || 1;

      // Calculate points with margins
      return data.map((value, index) => {
        const x = (index / (data.length - 1 || 1)) * 100;
        const y = 100 - ((value - dataMin) / range) * 100;
        return { x, y };
      });
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
                points: dataPoints,
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

export const SparklinesLine = React.forwardRef<
  SVGPathElement,
  SparklineLineProps & { points?: { x: number; y: number }[] }
>(
  (
    {
      points = [],
      color = '#1d4ed8',
      fill,
      fillOpacity = 0.1,
      className,
      ...props
    },
    ref,
  ) => {
    if (!points || points.length === 0) {
      return null;
    }

    // Create the line path
    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    // Create the fill path (if fill is enabled)
    const fillPath = fill
      ? `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`
      : '';

    return (
      <>
        {fill && (
          <path
            d={fillPath}
            fill={fill || color}
            fillOpacity={fillOpacity}
            className={cn('transition-opacity', className)}
          />
        )}
        <path
          ref={ref}
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('transition-all', className)}
          {...props}
        />
      </>
    );
  },
);

SparklinesLine.displayName = 'SparklinesLine';

// Additional sparkline components can be added here
// For example: SparklinesSpots, SparklinesBars, etc.
