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
import { DashboardCard } from './dashboard-card';
import { toast } from 'sonner';

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
    }));
  }, [chartData, previousWeekData]);

  const chartConfig = {
    prescriptions: {
      label: 'Prescriptions',
      color: 'hsl(var(--chart-1))',
    },
    currentPrescriptions: {
      label: 'Current Week',
      color: 'hsl(var(--chart-1))',
    },
    previousPrescriptions: {
      label: 'Previous Week',
      color: 'hsl(var(--chart-2))',
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Date Picker */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[180px] justify-start text-left font-normal',
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
            <div className="flex items-center gap-2">
              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={cardIsLoading || chartData.length === 0}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export
              </Button>
              {/* Comparison Toggle */}
              <Button
                variant={isComparing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsComparing(prev => !prev)}
                disabled={cardIsLoading || chartData.length === 0}
                aria-label="Toggle comparison view"
              >
                <Scale className="mr-2 h-4 w-4" />
                Compare
              </Button>
              {/* Chart Type Toggle */}
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
              <ChartContainer config={chartConfig} className="h-full w-full">
                {chartType === 'bar' ? (
                  <BarChart
                    accessibilityLayer
                    data={isComparing ? comparisonChartData : chartData}
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
                    {isComparing ? (
                      <>
                        <Bar
                          dataKey="previousPrescriptions"
                          fill="var(--color-previous-prescriptions)"
                          radius={[4, 4, 0, 0]}
                          // Remove stackId if you want side-by-side bars
                        />
                        <Bar
                          dataKey="currentPrescriptions"
                          fill="var(--color-current-prescriptions)"
                          radius={[4, 4, 0, 0]}
                          // Remove stackId if you want side-by-side bars
                        />
                      </>
                    ) : (
                      <Bar
                        dataKey="prescriptions"
                        fill="var(--color-prescriptions)"
                        radius={4}
                      />
                    )}
                  </BarChart>
                ) : (
                  <LineChart
                    accessibilityLayer
                    data={isComparing ? comparisonChartData : chartData}
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
                    {isComparing ? (
                      <>
                        <Line
                          type="monotone"
                          dataKey="previousPrescriptions"
                          stroke="var(--color-previous-prescriptions)"
                          strokeWidth={2}
                          dot={{
                            r: 4,
                            fill: 'var(--color-previous-prescriptions)',
                          }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="currentPrescriptions"
                          stroke="var(--color-current-prescriptions)"
                          strokeWidth={2}
                          dot={{
                            r: 4,
                            fill: 'var(--color-current-prescriptions)',
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </>
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="prescriptions"
                        stroke="var(--color-prescriptions)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'var(--color-prescriptions)' }}
                        activeDot={{ r: 6 }}
                      />
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
            className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4" // Adjusted gap and padding
          >
            <motion.div variants={itemVariants}>
              <p className="text-muted-foreground text-sm">
                Total Prescriptions
              </p>
              <p className="text-lg font-semibold">
                {totalCurrentWeekPrescriptions.toLocaleString()}
              </p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <p className="text-muted-foreground text-sm">vs. Previous Week</p>
              <p
                className={`text-lg font-semibold ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {percentageChange.toFixed(1)}%
              </p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <p className="text-muted-foreground text-sm">Daily Average</p>
              <p className="text-lg font-semibold">{dailyAverage.toFixed(1)}</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <p className="text-muted-foreground text-sm">Busiest Day</p>
              <p className="text-lg font-semibold">{busiestDay}</p>
            </motion.div>
          </motion.div>
        </div>
      )}
    </DashboardCard>
  );
}
