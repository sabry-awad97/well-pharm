import type { RevenueExpenseData } from '@/api/finance';
import { createComponentLogger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const log = createComponentLogger('RevenueExpenseChart');

interface RevenueExpenseChartProps {
  data: RevenueExpenseData[] | undefined;
  isLoading: boolean;
  isError: boolean;
  height?: number;
}

export function RevenueExpenseChart({
  data,
  isLoading,
  isError,
  height = 150,
}: RevenueExpenseChartProps) {
  log.debug('Rendering chart', {
    dataPoints: data?.length,
    isLoading,
    isError,
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-sm text-gray-500">Failed to load chart data</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 0, left: 0, bottom: 5 }}
        barGap={0}
        barCategoryGap={4}
      >
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        <Bar dataKey="expense" fill="#f97316" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
