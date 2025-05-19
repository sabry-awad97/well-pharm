import type { DailyData } from '@/api/overview';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import ChartDebugger from './chart-debugger';

// Chart Visualization Component
interface ChartVisualizationProps {
  chartType: 'bar' | 'line';
  isComparing: boolean;
  chartData: DailyData[];
  comparisonChartData: unknown[];
  chartConfig: ChartConfig;
}

function ChartVisualization({
  chartType,
  isComparing,
  chartData,
  comparisonChartData,
  chartConfig,
}: ChartVisualizationProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={chartType + (isComparing ? '-compare' : '')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative h-[240px] px-2"
      >
        {process.env.NODE_ENV !== 'production' && (
          <ChartDebugger
            data={isComparing ? comparisonChartData : chartData}
            chartType={chartType}
            isComparing={isComparing}
          />
        )}
        <ChartContainer
          config={chartConfig}
          className="h-full w-full"
          aria-hidden="false"
        >
          {chartType === 'bar' ? (
            <BarChart
              accessibilityLayer
              data={isComparing ? comparisonChartData : chartData}
              margin={{ top: 20, right: 30, bottom: 0, left: 0 }}
              className="transition-all duration-300 ease-in-out"
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-chart-grid, hsl(var(--border) / 0.5))"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="text-xs font-medium"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={value => value.toString()}
                className="text-xs"
                width={30}
                domain={[0, 'auto']}
              />
              {isComparing && (
                <YAxis
                  yAxisId="right"
                  orient="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={value => `$${(value / 1000).toFixed(1)}k`}
                  className="text-xs"
                  width={50}
                  domain={[0, 'auto']}
                />
              )}
              <ChartTooltip
                cursor={{
                  fill: 'var(--color-chart-grid, hsl(var(--border) / 0.5))',
                  opacity: 0.1,
                  radius: 4,
                }}
                content={
                  <ChartTooltipContent
                    indicator="dashed"
                    className="border-border/50 bg-background shadow-md backdrop-blur-sm"
                  />
                }
              />
              <ChartLegend
                content={<ChartLegendContent className="text-xs font-medium" />}
                verticalAlign="top"
                height={36}
              />
              {isComparing ? (
                <>
                  <Bar
                    dataKey="previousPrescriptions"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                    className="opacity-80"
                  />
                  <Bar
                    dataKey="currentPrescriptions"
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </>
              ) : (
                <Bar
                  dataKey="currentPrescriptions"
                  fill="hsl(var(--chart-1))"
                  radius={4}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              )}
            </BarChart>
          ) : (
            <LineChart
              accessibilityLayer
              data={isComparing ? comparisonChartData : chartData}
              margin={{ top: 20, right: 30, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={value => value.toString()}
                domain={[0, 'auto']}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={value => `$${(value / 1000).toFixed(1)}k`}
                domain={[0, 'auto']}
              />
              <ChartTooltip
                cursor={true}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => {
                      if (
                        typeof name === 'string' &&
                        name.includes('Revenue')
                      ) {
                        return [`$${value.toLocaleString()}`, name];
                      }
                      return [value, name];
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {isComparing ? (
                <>
                  <Line
                    type="natural"
                    dataKey="previousPrescriptions"
                    stroke="var(--color-previous-prescriptions)"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: 'var(--color-previous-prescriptions)',
                    }}
                    activeDot={{ r: 5 }}
                    yAxisId="left"
                  />
                  <Line
                    type="natural"
                    dataKey="currentPrescriptions"
                    stroke="var(--color-current-prescriptions)"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: 'var(--color-current-prescriptions)',
                    }}
                    activeDot={{ r: 5 }}
                    yAxisId="left"
                  />
                  <Line
                    type="natural"
                    dataKey="previousRevenue"
                    stroke="var(--color-previous-revenue)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--color-previous-revenue)' }}
                    activeDot={{ r: 5 }}
                    yAxisId="right"
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="natural"
                    dataKey="currentRevenue"
                    stroke="var(--color-current-revenue)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--color-current-revenue)' }}
                    activeDot={{ r: 5 }}
                    yAxisId="right"
                    strokeDasharray="5 5"
                  />
                </>
              ) : (
                <>
                  <Line
                    type="natural"
                    dataKey="currentPrescriptions"
                    stroke="var(--color-prescriptions)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-prescriptions)" }}
                    activeDot={{ r: 5 }}
                    yAxisId="left"
                  />
                  <Line
                    type="natural"
                    dataKey="currentRevenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-revenue)" }}
                    activeDot={{ r: 5 }}
                    yAxisId="right"
                    strokeDasharray="5 5"
                  />
                </>
              )}
            </LineChart>
          )}
        </ChartContainer>
      </motion.div>
    </AnimatePresence>
  );
}

export default ChartVisualization;
