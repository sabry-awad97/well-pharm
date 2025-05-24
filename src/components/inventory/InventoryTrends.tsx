import { useInventoryItems } from '@/api/inventory';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  BarChart2,
  LineChart,
  PieChart,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Generate mock data for charts - in a real implementation, this would come from your API
const generateMockData = (days: number) => {
  const data = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.unshift({
      date: date.toISOString().split('T')[0],
      stockIn: Math.floor(Math.random() * 50) + 10,
      stockOut: Math.floor(Math.random() * 30) + 5,
      totalValue: Math.floor(Math.random() * 5000) + 1000,
    });
  }

  return data;
};

// Colors for charts
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82ca9d',
];

type ChartType = 'stock' | 'value' | 'category';
type TimeRange = '7days' | '30days' | '90days' | 'year';

export function InventoryTrends() {
  // State for chart type
  const [chartType, setChartType] = useState<ChartType>('stock');

  // State for time range
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');

  const [chartData, setChartData] = useState<
    {
      date: string;
      stockIn: number;
      stockOut: number;
      totalValue: number;
    }[]
  >([]);

  const { data: products } = useInventoryItems();

  // Generate chart data based on selected time range
  useEffect(() => {
    const days =
      timeRange === '7days'
        ? 7
        : timeRange === '30days'
          ? 30
          : timeRange === '90days'
            ? 90
            : 365;
    setChartData(generateMockData(days));
  }, [timeRange]);

  // Calculate category distribution for pie chart
  const categoryData = products
    ? Object.entries(
        products.reduce((acc: Record<string, number>, product) => {
          const category = product.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {}),
      ).map(([name, value]) => ({ name, value }))
    : [];

  // Animation variants
  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const statCardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: 0.1 + i * 0.1,
      },
    }),
  };

  return (
    <div className="space-y-6">
      {/* Chart Type and Time Range Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Chart Type</Label>
          <div className="inline-flex rounded-md border p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setChartType('stock')}
              className={cn(
                'flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors',
                chartType === 'stock'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Stock</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('value')}
              className={cn(
                'flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors',
                chartType === 'value'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              <LineChart className="h-3.5 w-3.5" />
              <span>Value</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('category')}
              className={cn(
                'flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors',
                chartType === 'category'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              <PieChart className="h-3.5 w-3.5" />
              <span>Categories</span>
            </button>
          </div>
        </div>

        <div className="w-full sm:w-[160px]">
          <Label htmlFor="time-range" className="text-sm font-medium">
            Time Range
          </Label>
          <Select
            value={timeRange}
            onValueChange={value => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger id="time-range" className="h-9">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={chartType}
              variants={chartVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="h-[350px] w-full"
            >
              {/* Stock Flow Chart */}
              {chartType === 'stock' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={date => {
                        const d = new Date(date);
                        return timeRange === 'year'
                          ? d.toLocaleDateString(undefined, { month: 'short' })
                          : d.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            });
                      }}
                      tick={{ fontSize: 12 }}
                      interval={
                        timeRange === '7days'
                          ? 0
                          : timeRange === '30days'
                            ? 3
                            : timeRange === '90days'
                              ? 9
                              : 30
                      }
                    />
                    <YAxis
                      label={{
                        value: 'Units',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' },
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={value => [`${value} units`, '']}
                      labelFormatter={label =>
                        `Date: ${new Date(label).toLocaleDateString()}`
                      }
                      contentStyle={{
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar
                      dataKey="stockIn"
                      name="Stock In"
                      fill="#4ade80"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                    <Bar
                      dataKey="stockOut"
                      name="Stock Out"
                      fill="#f87171"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                      animationBegin={300}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}

              {/* Value Chart */}
              {chartType === 'value' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={date => {
                        const d = new Date(date);
                        return timeRange === 'year'
                          ? d.toLocaleDateString(undefined, { month: 'short' })
                          : d.toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            });
                      }}
                      tick={{ fontSize: 12 }}
                      interval={
                        timeRange === '7days'
                          ? 0
                          : timeRange === '30days'
                            ? 3
                            : timeRange === '90days'
                              ? 9
                              : 30
                      }
                    />
                    <YAxis
                      label={{
                        value: 'Value ($)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' },
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={value => [`$${value}`, '']}
                      labelFormatter={label =>
                        `Date: ${new Date(label).toLocaleDateString()}`
                      }
                      contentStyle={{
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="totalValue"
                      name="Inventory Value"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={
                        timeRange === '7days'
                          ? { r: 4 }
                          : timeRange === '30days'
                            ? { r: 3 }
                            : false
                      }
                      activeDot={{ r: 6 }}
                      animationDuration={1500}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}

              {/* Category Chart */}
              {chartType === 'category' &&
                (products && products.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={130}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        animationDuration={1000}
                        animationBegin={200}
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`${index}-cell-${color}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={value => [`${value} products`, '']}
                        contentStyle={{
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                    <PieChart className="text-muted-foreground h-12 w-12" />
                    <h3 className="mt-4 text-lg font-medium">
                      No Category Data
                    </h3>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Add products with categories to see distribution.
                    </p>
                  </div>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <motion.div
          custom={0}
          variants={statCardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="overflow-hidden border-t-4 border-t-blue-500/70 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-1">
                <p className="text-muted-foreground text-xs font-medium">
                  Average Stock Level
                </p>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold">
                    {products
                      ? Math.round(
                          products.reduce(
                            (sum, p) => sum + (p.stockLevel || 0),
                            0,
                          ) / products.length,
                        )
                      : 0}
                  </span>
                  <span className="text-muted-foreground ml-1 text-xs">
                    units
                  </span>
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUp className="mr-1 h-3 w-3" />
                  <span>12% increase</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          custom={1}
          variants={statCardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="overflow-hidden border-t-4 border-t-amber-500/70 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-1">
                <p className="text-muted-foreground text-xs font-medium">
                  Inventory Turnover
                </p>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold">2.4</span>
                  <span className="text-muted-foreground ml-1 text-xs">
                    ratio
                  </span>
                </div>
                <div className="flex items-center text-xs text-red-600">
                  <ArrowDown className="mr-1 h-3 w-3" />
                  <span>3% decrease</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          custom={2}
          variants={statCardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="overflow-hidden border-t-4 border-t-green-500/70 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-1">
                <p className="text-muted-foreground text-xs font-medium">
                  Total Inventory Value
                </p>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold">
                    $
                    {products
                      ? products
                          .reduce(
                            (sum, p) =>
                              sum +
                              (p.stockLevel || 0) * (p.purchasePrice || 0),
                            0,
                          )
                          .toFixed(2)
                      : '0.00'}
                  </span>
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUp className="mr-1 h-3 w-3" />
                  <span>8% increase</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
