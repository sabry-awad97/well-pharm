import { Button } from '@/components/ui/button';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Clock,
  LineChartIcon,
} from 'lucide-react'; // Added icons
import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line, // Added Line for LineChart
  LineChart, // Added LineChart
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardCard } from './dashboard-card';

// Helper to get the start of a week (Monday)
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

// Mock API data structure
interface DailyData {
  day: string;
  prescriptions: number;
}

// Mock API function
const fetchWeeklyData = async (startDate: Date): Promise<DailyData[]> => {
  console.log(`Fetching data for week starting: ${startDate.toDateString()}`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 750));

  // Simulate potential API error
  // if (Math.random() > 0.8) {
  //   throw new Error('Failed to fetch weekly data. Please try again.');
  // }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    prescriptions:
      Math.floor(Math.random() * ((startDate.getDate() % 10) + 1) * 15) + 20, // Vary data slightly based on date
  }));
};

interface WeeklyOverviewCardProps {
  onRefresh: () => void; // This prop might be re-purposed or used alongside internal refresh
  isFetching: boolean; // This prop might indicate an overall app fetching state
}

export function WeeklyOverviewCard({
  onRefresh: onParentRefresh, // Renamed to avoid conflict
  isFetching: isParentFetching, // Renamed
}: WeeklyOverviewCardProps) {
  const [currentStartDate, setCurrentStartDate] = React.useState<Date>(() =>
    getStartOfWeek(new Date()),
  );
  const [chartData, setChartData] = React.useState<DailyData[]>([]);
  const [previousWeekData, setPreviousWeekData] = React.useState<DailyData[]>(
    [],
  );
  const [chartType, setChartType] = React.useState<'bar' | 'line'>('bar');
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async (date: Date) => {
    setIsLoadingData(true);
    setError(null);
    try {
      const currentWeekPromise = fetchWeeklyData(date);
      const prevWeekStartDate = new Date(date);
      prevWeekStartDate.setDate(date.getDate() - 7);
      const previousWeekPromise = fetchWeeklyData(prevWeekStartDate);

      const [currentData, prevData] = await Promise.all([
        currentWeekPromise,
        previousWeekPromise,
      ]);

      setChartData(currentData);
      setPreviousWeekData(prevData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.',
      );
      setChartData([]);
      setPreviousWeekData([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData(currentStartDate);
  }, [currentStartDate, fetchData]);

  const handleRefresh = () => {
    fetchData(currentStartDate);
    if (onParentRefresh) {
      onParentRefresh(); // Call parent refresh if provided
    }
  };

  const refreshButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleRefresh}
      disabled={isLoadingData || isParentFetching}
    >
      {isLoadingData || isParentFetching ? (
        <Clock className="h-4 w-4 animate-spin" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
    </Button>
  );

  const chartConfig = {
    prescriptions: {
      label: 'Prescriptions',
      color: 'hsl(var(--chart-1))',
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
      return totalCurrentWeekPrescriptions > 0 ? 100 : 0; // Or 'N/A'
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

  const cardIsLoading = isLoadingData || isParentFetching;

  return (
    <DashboardCard
      title="Weekly Overview"
      description={`Data for week starting: ${currentStartDate.toLocaleDateString()}`}
      className="col-span-4"
      action={refreshButton}
      isLoading={cardIsLoading}
    >
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDateChange('prev')}
              disabled={cardIsLoading}
              aria-label="Previous week"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="w-28 text-center text-sm font-medium">
              {currentStartDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
              {' - '}
              {new Date(
                new Date(currentStartDate).setDate(
                  currentStartDate.getDate() + 6,
                ),
              ).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDateChange('next')}
              disabled={cardIsLoading}
              aria-label="Next week"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              disabled={cardIsLoading}
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Bar
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              disabled={cardIsLoading}
            >
              <LineChartIcon className="mr-2 h-4 w-4" />
              Line
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-500">
            Error: {error}
          </div>
        )}

        {!error && (
          <>
            <div className="h-[240px] px-2">
              <ChartContainer config={chartConfig} className="h-full w-full">
                {chartType === 'bar' ? (
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ top: 20, right: 20, bottom: 0, left: 0 }}
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
                      cursor={true}
                      content={<ChartTooltipContent indicator="dashed" />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="prescriptions"
                      fill="var(--color-prescriptions)"
                      radius={4}
                    />
                  </BarChart>
                ) : (
                  <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ top: 20, right: 20, bottom: 0, left: 0 }}
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
                      cursor={true}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="prescriptions"
                      stroke="var(--color-prescriptions)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: 'var(--color-prescriptions)' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </ChartContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-sm">
                  Total Prescriptions
                </p>
                <p className="text-lg font-semibold">
                  {totalCurrentWeekPrescriptions.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  vs. Previous Week
                </p>
                <p
                  className={`text-lg font-semibold ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {percentageChange.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Daily Average</p>
                <p className="text-lg font-semibold">
                  {dailyAverage.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Busiest Day</p>
                <p className="text-lg font-semibold">{busiestDay}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardCard>
  );
}
