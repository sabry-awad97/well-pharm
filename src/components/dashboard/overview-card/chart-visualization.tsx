'use client';

import type { DailyData } from '@/api/overview';
import type { ChartConfig } from '@/components/ui/chart';
import { AnimatePresence, motion } from 'framer-motion';
import ChartDebugger from './chart-debugger';

// Chart Visualization Component
interface ChartVisualizationProps {
  chartType: 'bar' | 'line';
  isComparing: boolean;
  chartData: DailyData[];
  comparisonChartData: DailyData[];
  chartConfig: ChartConfig;
}

// Bar Chart Placeholder Component
function BarChartDisplay({ isComparing }: { isComparing: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="mb-2 text-lg font-medium text-zinc-500 dark:text-zinc-400">
        Bar Chart Placeholder
      </p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {isComparing ? 'Comparison Mode' : 'Standard Mode'}
      </p>
    </div>
  );
}

// Line Chart Placeholder Component
function LineChartDisplay({ isComparing }: { isComparing: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="mb-2 text-lg font-medium text-zinc-500 dark:text-zinc-400">
        Line Chart Placeholder
      </p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {isComparing ? 'Comparison Mode' : 'Standard Mode'}
      </p>
    </div>
  );
}

function ChartVisualization({
  chartType,
  isComparing,
  chartData,
  comparisonChartData,
  chartConfig: _,
}: ChartVisualizationProps) {
  const data = isComparing ? comparisonChartData : chartData;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={chartType + (isComparing ? '-compare' : '')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative h-[240px] w-full"
      >
        {process.env.NODE_ENV !== 'production' && (
          <ChartDebugger
            data={data}
            chartType={chartType}
            isComparing={isComparing}
          />
        )}
        <div className="h-full w-full">
          {chartType === 'bar' ? (
            <BarChartDisplay isComparing={isComparing} />
          ) : (
            <LineChartDisplay isComparing={isComparing} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ChartVisualization;
