import { useCompareWeeklyOverviewData } from '@/api/overview';
import { Button } from '@/components/ui/button';
import type { ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { DashboardCard } from '../dashboard-card';
import ChartControls from './chart-controls';
import ChartSummary from './chart-summary';
import ChartVisualization from './chart-visualization';
import SkeletonLoader from './skeleton-loader';
import { getStartOfWeek } from './utils';

interface OverviewCardProps {
  onRefresh: () => void;
  isFetching: boolean;
}

export function OverviewCard({
  onRefresh: onParentRefresh,
  isFetching: isParentFetching,
}: OverviewCardProps) {
  const [currentStartDate, setCurrentStartDate] = React.useState<Date>(() =>
    getStartOfWeek(new Date()),
  );
  const [chartType, setChartType] = React.useState<'bar' | 'line'>('bar');
  const [isComparing, setIsComparing] = React.useState(false);

  // Use the combined hook for fetching both current and previous week data
  const {
    currentWeek,
    previousWeek,
    isLoading,
    isFetching,
    isError,
    error,
    isPlaceholderData,
    refetch,
  } = useCompareWeeklyOverviewData(currentStartDate, {
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const chartData = currentWeek.data || [];
  const previousWeekData = previousWeek.data || [];

  const handleRefresh = () => {
    refetch();
    if (onParentRefresh) {
      onParentRefresh();
    }
  };

  const handleExport = () => {
    console.log('Exporting data:', chartData);
    toast.info('Export functionality not fully implemented yet.');
  };

  // Prepare data for comparison chart
  const comparisonChartData = React.useMemo(() => {
    return chartData.map((item, index) => ({
      day: item.day,
      currentPrescriptions: item.prescriptions,
      previousPrescriptions: previousWeekData[index]?.prescriptions || 0,
      currentRevenue: item.revenue,
      previousRevenue: previousWeekData[index]?.revenue || 0,
    }));
  }, [chartData, previousWeekData]);

  const chartConfig = {
    prescriptions: {
      label: 'Prescriptions',
      color: 'hsl(var(--chart-1))',
    },
    revenue: {
      label: 'Revenue ($)',
      color: 'hsl(var(--chart-3))',
    },
    currentPrescriptions: {
      label: 'Current Week Prescriptions',
      color: 'hsl(var(--chart-1))',
    },
    previousPrescriptions: {
      label: 'Previous Week Prescriptions',
      color: 'hsl(var(--chart-2))',
    },
    currentRevenue: {
      label: 'Current Week Revenue',
      color: 'hsl(var(--chart-3))',
    },
    previousRevenue: {
      label: 'Previous Week Revenue',
      color: 'hsl(var(--chart-4))',
    },
  } satisfies ChartConfig;

  // Calculations for summary
  const totalCurrentWeekPrescriptions = React.useMemo(
    () => chartData.reduce((sum, item) => sum + item.prescriptions, 0),
    [chartData],
  );
  const totalPreviousWeekPrescriptions = React.useMemo(
    () => previousWeekData.reduce((sum, item) => sum + item.prescriptions, 0),
    [previousWeekData],
  );

  const percentageChange = React.useMemo(() => {
    if (totalPreviousWeekPrescriptions === 0) {
      return totalCurrentWeekPrescriptions > 0 ? 100 : 0;
    }
    return (
      ((totalCurrentWeekPrescriptions - totalPreviousWeekPrescriptions) /
        totalPreviousWeekPrescriptions) *
      100
    );
  }, [totalCurrentWeekPrescriptions, totalPreviousWeekPrescriptions]);

  const dailyAverage = React.useMemo(
    () =>
      chartData.length > 0
        ? totalCurrentWeekPrescriptions / chartData.length
        : 0,
    [chartData, totalCurrentWeekPrescriptions],
  );

  const busiestDay = React.useMemo(() => {
    if (chartData.length === 0) return 'N/A';
    return chartData.reduce(
      (busiest, current) =>
        current.prescriptions > busiest.prescriptions ? current : busiest,
      chartData[0],
    ).day;
  }, [chartData]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    setCurrentStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
      return newDate;
    });
  };

  const cardIsLoading = isLoading || isFetching || isParentFetching;

  // Refresh button for the card header
  const refreshButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleRefresh}
      disabled={cardIsLoading}
      aria-label="Refresh data"
    >
      <Clock
        className={cn(
          'h-4 w-4',
          cardIsLoading && 'text-muted-foreground animate-spin',
        )}
      />
    </Button>
  );

  return (
    <DashboardCard
      title="Overview"
      description={`Data for week starting: ${currentStartDate.toLocaleDateString()}`}
      className="col-span-4"
      action={refreshButton}
      isLoading={cardIsLoading}
    >
      {cardIsLoading && !isError ? (
        <SkeletonLoader />
      ) : isError ? (
        <div className="p-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-500">
            Error:{' '}
            {error instanceof Error
              ? error.message
              : 'An unknown error occurred'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ChartControls
            currentStartDate={currentStartDate}
            setCurrentStartDate={setCurrentStartDate}
            chartType={chartType}
            setChartType={setChartType}
            isComparing={isComparing}
            setIsComparing={setIsComparing}
            handleDateChange={handleDateChange}
            handleExport={handleExport}
            isLoading={cardIsLoading}
            isPlaceholderData={isPlaceholderData}
          />

          <ChartVisualization
            chartType={chartType}
            isComparing={isComparing}
            chartData={chartData}
            comparisonChartData={comparisonChartData}
            chartConfig={chartConfig}
          />

          <ChartSummary
            totalCurrentWeekPrescriptions={totalCurrentWeekPrescriptions}
            percentageChange={percentageChange}
            dailyAverage={dailyAverage}
            busiestDay={busiestDay}
          />
        </div>
      )}
    </DashboardCard>
  );
}
