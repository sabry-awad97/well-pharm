import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar'; // Added Calendar
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'; // Added Popover
import { cn } from '@/lib/utils'; // Added cn helper
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  CalendarIcon, // Added Calendar icon
  Clock,
  DownloadIcon, // Added Download icon
  LineChartIcon,
  Scale,
} from 'lucide-react';
import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { DashboardCard } from './dashboard-card';

// Helper to get the start of a week (Monday)
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0); // Set time to start of day
  return start;
};

// Mock API data structure
interface DailyData {
  day: string;
  prescriptions: number;
  revenue: number; // Added revenue field
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
  return days.map(day => {
    const prescriptions =
      Math.floor(Math.random() * ((startDate.getDate() % 10) + 1) * 15) + 20;
    // Generate revenue based on prescriptions with some variability
    const revenue = prescriptions * (Math.random() * 50 + 100);

    return {
      day,
      prescriptions,
      revenue: Math.round(revenue), // Round to whole number for simplicity
    };
  });
};

interface WeeklyOverviewCardProps {
  onRefresh: () => void;
  isFetching: boolean;
}

export function WeeklyOverviewCard({
  onRefresh: onParentRefresh,
  isFetching: isParentFetching,
}: WeeklyOverviewCardProps) {
  const [currentStartDate, setCurrentStartDate] = React.useState<Date>(() =>
    getStartOfWeek(new Date()),
  );
  const [chartData, setChartData] = React.useState<DailyData[]>([]);
  const [previousWeekData, setPreviousWeekData] = React.useState<DailyData[]>(
    [],
  );
  const [chartType, setChartType] = React.useState<'bar' | 'line'>('bar');
  const [isComparing, setIsComparing] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false); // State for calendar popover

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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentStartDate(getStartOfWeek(date));
      setIsCalendarOpen(false); // Close calendar after selection
    }
  };

  const handleExport = () => {
    // Placeholder for export logic
    console.log('Exporting data:', chartData);
    toast.info('Export functionality not fully implemented yet.');
    // Example: Convert chartData to CSV or JSON and trigger download
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

  // Prepare data for comparison chart
  const comparisonChartData = React.useMemo(() => {
    // Assuming chartData and previousWeekData are aligned by day index
    return chartData.map((item, index) => ({
      day: item.day,
      currentPrescriptions: item.prescriptions,
      previousPrescriptions: previousWeekData[index]?.prescriptions || 0, // Handle case where prev data might be missing
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

  // Added calculations for revenue
  const totalCurrentWeekRevenue = React.useMemo(
    () => chartData.reduce((sum, item) => sum + item.revenue, 0),
    [chartData],
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

  const cardIsLoading = isLoadingData || isParentFetching;

  // Framer Motion variants for staggered summary items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Stagger delay between children
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Skeleton Loader structure
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-muted h-8 w-8 rounded-md" />
          <div className="bg-muted h-8 w-28 rounded-md" />
          <div className="bg-muted h-8 w-8 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted h-8 w-20 rounded-md" />
          <div className="bg-muted h-8 w-16 rounded-md" />
        </div>
      </div>
      <div className="bg-muted h-[240px] w-full rounded-md px-2" />
      <div className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
        <div className="space-y-1">
          <div className="bg-muted h-4 w-24 rounded" />
          <div className="bg-muted h-6 w-16 rounded" />
        </div>
        <div className="space-y-1">
          <div className="bg-muted h-4 w-24 rounded" />
          <div className="bg-muted h-6 w-16 rounded" />
        </div>
        <div className="space-y-1">
          <div className="bg-muted h-4 w-24 rounded" />
          <div className="bg-muted h-6 w-16 rounded" />
        </div>
        <div className="space-y-1">
          <div className="bg-muted h-4 w-24 rounded" />
          <div className="bg-muted h-6 w-16 rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardCard
      title="Weekly Overview"
      description={`Data for week starting: ${currentStartDate.toLocaleDateString()}`}
      className="col-span-4"
      action={refreshButton}
      isLoading={cardIsLoading} // DashboardCard might show its own spinner based on this
    >
      {cardIsLoading && !error ? (
        <SkeletonLoader />
      ) : error ? (
        <div className="p-4">
          {/* Added padding */}
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-500">
            Error: {error}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Adjusted padding and spacing */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Picker */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal sm:w-[180px]',
                      !currentStartDate && 'text-muted-foreground',
                    )}
                    disabled={cardIsLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentStartDate ? (
                      currentStartDate.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentStartDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {/* Prev/Next Week Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDateChange('prev')}
                  disabled={cardIsLoading}
                  aria-label="Previous week"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
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
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                {/* Chart Type Toggle - Simplified for mobile */}
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                  disabled={cardIsLoading}
                  className="px-2 sm:px-3"
                >
                  <BarChart2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Bar</span>
                </Button>
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  disabled={cardIsLoading}
                  className="px-2 sm:px-3"
                >
                  <LineChartIcon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Line</span>
                </Button>
              </div>

              <div className="flex items-center gap-1">
                {/* Comparison Toggle */}
                <Button
                  variant={isComparing ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsComparing(prev => !prev)}
                  disabled={cardIsLoading || chartData.length === 0}
                  aria-label="Toggle comparison view"
                  className="px-2 sm:px-3"
                >
                  <Scale className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Compare</span>
                </Button>

                {/* Export Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={cardIsLoading || chartData.length === 0}
                  className="px-2 sm:px-3"
                >
                  <DownloadIcon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </div>
          {/* Animate presence for chart type transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={chartType + (isComparing ? '-compare' : '')} // Key changes when chartType or comparison changes
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-[240px] px-2"
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
                      // Remove yAxisId="left" if you're not using multiple axes
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tickFormatter={value => value.toString()}
                      className="text-xs"
                      width={30}
                      domain={[0, 'auto']}
                    />
                    {/* Only add this secondary YAxis if you're actually using it */}
                    {isComparing && (
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={value =>
                          `$${(value / 1000).toFixed(1)}k`
                        }
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
                      content={
                        <ChartLegendContent className="text-xs font-medium" />
                      }
                      verticalAlign="top"
                      height={36}
                    />
                    {isComparing ? (
                      <>
                        <Bar
                          dataKey="previousPrescriptions"
                          fill="hsl(var(--chart-2))" // Direct HSL value as fallback
                          radius={[4, 4, 0, 0]}
                          animationDuration={800}
                          animationEasing="ease-out"
                          className="opacity-80"
                          // Remove yAxisId if not using multiple axes
                        />
                        <Bar
                          dataKey="currentPrescriptions"
                          fill="hsl(var(--chart-1))" // Direct HSL value as fallback
                          radius={[4, 4, 0, 0]}
                          animationDuration={800}
                          animationEasing="ease-out"
                          // Remove yAxisId if not using multiple axes
                        />
                      </>
                    ) : (
                      <Bar
                        dataKey="prescriptions"
                        fill="hsl(var(--chart-1))" // Direct HSL value as fallback
                        radius={4}
                        animationDuration={800}
                        animationEasing="ease-out"
                        // Remove yAxisId if not using multiple axes
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
                          dataKey="prescriptions"
                          stroke="var(--color-prescriptions)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'var(--color-prescriptions)' }}
                          activeDot={{ r: 5 }}
                          yAxisId="left"
                        />
                        <Line
                          type="natural"
                          dataKey="revenue"
                          stroke="var(--color-revenue)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'var(--color-revenue)' }}
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
          {/* Summary Section with Staggered Animation */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4"
          >
            <motion.div
              variants={itemVariants}
              className="hover:bg-muted/50 rounded-lg p-2 transition-colors"
            >
              <p className="text-muted-foreground text-xs font-medium">
                Total Prescriptions
              </p>
              <p className="text-xl font-bold tracking-tight">
                {totalCurrentWeekPrescriptions.toLocaleString()}
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="hover:bg-muted/50 rounded-lg p-2 transition-colors"
            >
              <p className="text-muted-foreground text-xs font-medium">
                vs. Previous Week
              </p>
              <div className="flex items-center gap-1">
                <p
                  className={cn(
                    'text-xl font-bold tracking-tight',
                    percentageChange >= 0
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : 'text-red-600 dark:text-red-500',
                  )}
                >
                  {percentageChange.toFixed(1)}%
                </p>
                {percentageChange !== 0 && (
                  <span
                    className={cn(
                      'text-xs',
                      percentageChange > 0
                        ? 'text-emerald-600 dark:text-emerald-500'
                        : 'text-red-600 dark:text-red-500',
                    )}
                  >
                    {percentageChange > 0 ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="hover:bg-muted/50 rounded-lg p-2 transition-colors"
            >
              <p className="text-muted-foreground text-xs font-medium">
                Daily Average
              </p>
              <p className="text-xl font-bold tracking-tight">
                {dailyAverage.toFixed(1)}
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="hover:bg-muted/50 rounded-lg p-2 transition-colors"
            >
              <p className="text-muted-foreground text-xs font-medium">
                Busiest Day
              </p>
              <p className="text-xl font-bold tracking-tight">{busiestDay}</p>
            </motion.div>
          </motion.div>
        </div>
      )}
    </DashboardCard>
  );
}

// Add this debugging component to help identify issues
const ChartDebugger = ({
  data,
  chartType,
  isComparing,
}: {
  data: unknown[];
  chartType: 'bar' | 'line';
  isComparing: boolean;
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="mb-2 rounded border border-yellow-300 bg-yellow-50 p-2 text-xs">
        No data available for chart rendering
      </div>
    );
  }

  // Check for required properties based on chart type and mode
  const requiredProps = isComparing
    ? ['currentPrescriptions', 'previousPrescriptions']
    : ['prescriptions'];

  if (chartType === 'line' && isComparing) {
    requiredProps.push('currentRevenue', 'previousRevenue');
  } else if (chartType === 'line') {
    requiredProps.push('revenue');
  }

  const missingProps = requiredProps.filter(
    prop =>
      !data.some(
        item => item !== null && typeof item === 'object' && prop in item,
      ),
  );

  const hasAllRequiredProps = missingProps.length === 0;
  const hasZeroValues = data.every(item =>
    requiredProps.every(
      prop =>
        item !== null &&
        typeof item === 'object' &&
        prop in item &&
        ((item as Record<string, unknown>)[prop] === 0 ||
          (item as Record<string, unknown>)[prop] === null ||
          (item as Record<string, unknown>)[prop] === undefined),
    ),
  );

  return (
    <details className="mb-2 rounded border p-2 text-xs">
      <summary className="cursor-pointer font-medium">
        Chart Debug Info {!hasAllRequiredProps && '⚠️'}
        {hasZeroValues && ' (Zero Values)'}
      </summary>
      <div className="mt-2 space-y-2">
        <div>
          <strong>Chart Type:</strong> {chartType},
          <strong>Comparison Mode:</strong> {isComparing ? 'Yes' : 'No'}
        </div>

        {!hasAllRequiredProps && (
          <div className="rounded border border-red-300 bg-red-50 p-2">
            <strong>Missing properties:</strong> {missingProps.join(', ')}
          </div>
        )}

        {hasZeroValues && (
          <div className="rounded border border-yellow-300 bg-yellow-50 p-2">
            <strong>Warning:</strong> All data values are zero or null
          </div>
        )}

        <div>
          <strong>Data Sample:</strong>
          <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-100 p-2">
            {JSON.stringify(data[0], null, 2)}
          </pre>
        </div>

        <div>
          <strong>Full Dataset:</strong>
          <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-100 p-2">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </details>
  );
};
