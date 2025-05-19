import { DebugPanel } from '@/components/debug/debug-panel';

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
  // Check for required properties based on chart type and mode
  const requiredProps = isComparing
    ? ['currentPrescriptions', 'previousPrescriptions']
    : ['currentPrescriptions'];

  if (chartType === 'line' && isComparing) {
    requiredProps.push('currentRevenue', 'previousRevenue');
  } else if (chartType === 'line') {
    requiredProps.push('currentRevenue');
  }

  const validateChartData = (chartData: unknown) => {
    if (!Array.isArray(chartData)) {
      return { isValid: false, issues: ['Data is not an array'] };
    }

    const missingProps = requiredProps.filter(
      prop =>
        !chartData.some(
          item => item !== null && typeof item === 'object' && prop in item,
        ),
    );

    const hasZeroValues = chartData.every(item =>
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

    const issues = [];
    if (missingProps.length > 0) {
      issues.push(`Missing properties: ${missingProps.join(', ')}`);
    }
    if (hasZeroValues) {
      issues.push('All data values are zero or null');
    }

    return {
      isValid: missingProps.length === 0 && !hasZeroValues,
      issues: issues.length > 0 ? issues : undefined,
    };
  };

  return (
    <DebugPanel
      data={data}
      componentName="Chart"
      validate={validateChartData}
      position="top-right"
      additionalInfo={{
        'Chart Type': chartType,
        'Comparison Mode': isComparing ? 'Yes' : 'No',
        'Required Properties': requiredProps.join(', '),
      }}
    />
  );
};

export default ChartDebugger;
