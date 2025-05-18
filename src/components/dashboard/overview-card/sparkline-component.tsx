import { memo } from 'react';

interface SparklineProps {
  data: Array<{ value: number }>;
  color: string;
  height?: number;
  width?: number;
}

const SparklineComponent = memo(function SparklineComponent({
  data,
  color,
  height = 20,
  width = 80,
}: SparklineProps) {
  // Calculate min and max values for scaling
  const values = data.map(item => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1; // Prevent division by zero

  // Calculate points for the sparkline
  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      // Invert the y-coordinate (SVG y-axis goes from top to bottom)
      const y = height - ((item.value - minValue) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      <title>Sparkline Chart</title>
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Area under the line */}
      <path
        d={`M0,${height} ${points} ${width},${height} Z`}
        fill={`${color}20`} // Add transparency to the fill
      />

      {/* Highlight the last point */}
      <circle
        cx={width}
        cy={
          height - ((data[data.length - 1].value - minValue) / range) * height
        }
        r="2"
        fill={color}
      />
    </svg>
  );
});

export default SparklineComponent;
