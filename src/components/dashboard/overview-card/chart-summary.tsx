import { TooltipProvider } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import SummaryItem from './summary-item'; // Import the new component

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
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4"
      >
        {/* Total Prescriptions */}
        <SummaryItem
          label="Total Prescriptions"
          value={totalCurrentWeekPrescriptions.toLocaleString()}
          tooltipContent="Total prescriptions dispensed this week."
          itemVariants={itemVariants}
        />

        {/* Percentage Change */}
        <SummaryItem
          label="vs. Previous Week"
          tooltipContent="Percentage change compared to the previous week."
          itemVariants={itemVariants}
          isPercentageChange={true}
          percentageChangeValue={percentageChange}
        />

        {/* Daily Average */}
        <SummaryItem
          label="Daily Average"
          value={dailyAverage.toFixed(1)}
          tooltipContent="Average number of prescriptions per day this week."
          itemVariants={itemVariants}
        />

        {/* Busiest Day */}
        <SummaryItem
          label="Busiest Day"
          value={busiestDay}
          tooltipContent="The day with the highest number of prescriptions this week."
          itemVariants={itemVariants}
        />
      </motion.div>
    </TooltipProvider>
  );
}

export default ChartSummary;
