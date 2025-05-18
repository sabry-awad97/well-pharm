import { TooltipProvider } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import SummaryItem from './summary-item'; // Import the new component

// Chart Summary Component
interface ChartSummaryProps {
  totalCurrentWeekPrescriptions: number;
  percentageChange: number;
  dailyAverage: number;
  busiestDay: string;
  // Optional historical data
  historicalPrescriptions?: number[];
  historicalPercentages?: number[];
  historicalAverages?: number[];
}

function ChartSummary({
  totalCurrentWeekPrescriptions,
  percentageChange,
  dailyAverage,
  busiestDay,
  historicalPrescriptions = [],
  historicalPercentages = [],
  historicalAverages = [],
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

  // Format historical data for sparklines
  const formattedPrescriptionHistory = historicalPrescriptions.map(value => ({
    value,
  }));
  const formattedPercentageHistory = historicalPercentages.map(value => ({
    value,
  }));
  const formattedAverageHistory = historicalAverages.map(value => ({ value }));

  // Determine if values are critical (for example, if percentage change is very negative)
  const isPercentageCritical = percentageChange < -15;

  // Create detailed information for expandable panels
  const prescriptionDetails = (
    <div>
      <p className="mb-1 font-medium">Weekly Prescription Breakdown</p>
      <ul className="list-disc space-y-1 pl-4">
        <li>
          New prescriptions: {Math.round(totalCurrentWeekPrescriptions * 0.3)}
        </li>
        <li>Refills: {Math.round(totalCurrentWeekPrescriptions * 0.7)}</li>
        <li>
          Insurance claims: {Math.round(totalCurrentWeekPrescriptions * 0.85)}
        </li>
        <li>
          Cash payments: {Math.round(totalCurrentWeekPrescriptions * 0.15)}
        </li>
      </ul>
    </div>
  );

  const percentageDetails = (
    <div>
      <p className="mb-1 font-medium">Performance Analysis</p>
      <ul className="list-disc space-y-1 pl-4">
        <li>4-week trend: {percentageChange > 0 ? 'Upward' : 'Downward'}</li>
        <li>Seasonal adjustment: {(percentageChange + 2.5).toFixed(1)}%</li>
        <li>YoY comparison: {(percentageChange * 1.2).toFixed(1)}%</li>
      </ul>
    </div>
  );

  const averageDetails = (
    <div>
      <p className="mb-1 font-medium">Daily Distribution</p>
      <ul className="list-disc space-y-1 pl-4">
        <li>Weekday average: {(dailyAverage * 1.2).toFixed(1)}</li>
        <li>Weekend average: {(dailyAverage * 0.6).toFixed(1)}</li>
        <li>Peak hour: 2-3 PM</li>
      </ul>
    </div>
  );

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
          statusIndicator="info"
          historicalData={formattedPrescriptionHistory}
          detailedInfo={prescriptionDetails}
        />

        {/* Percentage Change */}
        <SummaryItem
          label="vs. Previous Week"
          tooltipContent="Percentage change compared to the previous week."
          itemVariants={itemVariants}
          isPercentageChange={true}
          percentageChangeValue={percentageChange}
          isCritical={isPercentageCritical}
          historicalData={formattedPercentageHistory}
          detailedInfo={percentageDetails}
        />

        {/* Daily Average */}
        <SummaryItem
          label="Daily Average"
          value={dailyAverage.toFixed(1)}
          tooltipContent="Average number of prescriptions per day this week."
          itemVariants={itemVariants}
          statusIndicator={dailyAverage > 50 ? 'success' : 'warning'}
          historicalData={formattedAverageHistory}
          detailedInfo={averageDetails}
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
