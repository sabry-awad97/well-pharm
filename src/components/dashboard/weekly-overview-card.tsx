import { Button } from '@/components/ui/button';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Clock } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { DashboardCard } from './dashboard-card';

interface WeeklyOverviewCardProps {
  onRefresh: () => void;
  isFetching: boolean;
}

export function WeeklyOverviewCard({
  onRefresh,
  isFetching,
}: WeeklyOverviewCardProps) {
  const refreshButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={onRefresh}
      disabled={isFetching}
    >
      {isFetching ? (
        <Clock className="h-4 w-4 animate-spin" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
    </Button>
  );

  const chartData = [
    { day: 'Mon', prescriptions: Math.floor(Math.random() * 100) + 50 },
    { day: 'Tue', prescriptions: Math.floor(Math.random() * 100) + 50 },
    { day: 'Wed', prescriptions: Math.floor(Math.random() * 100) + 50 },
    { day: 'Thu', prescriptions: Math.floor(Math.random() * 100) + 50 },
    { day: 'Fri', prescriptions: Math.floor(Math.random() * 100) + 50 },
    { day: 'Sat', prescriptions: Math.floor(Math.random() * 100) + 20 },
    { day: 'Sun', prescriptions: Math.floor(Math.random() * 100) + 10 },
  ];

  const chartConfig = {
    prescriptions: {
      label: 'Prescriptions',
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;

  return (
    <DashboardCard
      title="Weekly Overview"
      description="Pharmacy performance for the past week"
      className="col-span-4"
      action={refreshButton}
      isLoading={isFetching} // Changed from false to isFetching
    >
      <div className="h-[240px] px-2">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              bottom: 0,
              left: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={value => value.toString()}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="prescriptions"
              fill="var(--color-prescriptions)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </DashboardCard>
  );
}
