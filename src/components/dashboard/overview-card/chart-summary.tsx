import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Chart Summary Component
interface ChartSummaryProps {
  totalCurrentWeekPrescriptions: number;
  percentageChange: number;
  dailyAverage: number;
  busiestDay: string;
}

function ChartSummary({
  totalCurrentWeekPrescriptions,
  percentageChange,
  dailyAverage,
  busiestDay,
}: ChartSummaryProps) {
  // Framer Motion variants for staggered summary items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
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
        <p className="text-muted-foreground text-xs font-medium">Busiest Day</p>
        <p className="text-xl font-bold tracking-tight">{busiestDay}</p>
      </motion.div>
    </motion.div>
  );
}
export default ChartSummary;
