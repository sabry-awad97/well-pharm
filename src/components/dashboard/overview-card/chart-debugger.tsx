import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'; // Added Popover
import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

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
  if (process.env.NODE_ENV === 'production') return null;

  const [copiedSample, setCopiedSample] = React.useState(false);
  const [copiedFull, setCopiedFull] = React.useState(false);

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

  const copyToClipboard = (text: string, isSample: boolean) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (isSample) {
          setCopiedSample(true);
          setTimeout(() => setCopiedSample(false), 1500);
        } else {
          setCopiedFull(true);
          setTimeout(() => setCopiedFull(false), 1500);
        }

        toast.success('Copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard');
      });
  };

  return (
    <div className="absolute top-2 right-2 z-10">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border-amber-200 bg-amber-50 hover:bg-amber-100"
          >
            <span className="sr-only">Open chart debug info</span>
            {!hasAllRequiredProps ? (
              <span className="text-xs font-bold text-amber-600">⚠️</span>
            ) : hasZeroValues ? (
              <span className="text-xs font-bold text-amber-600">0</span>
            ) : (
              <span className="font-mono text-xs text-zinc-500">D</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="border-border/50 border-b p-3">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              Chart Debug Info
              {!hasAllRequiredProps && (
                <span className="text-xs text-amber-500">⚠️ Issues Found</span>
              )}
              {hasZeroValues && (
                <span className="text-xs text-amber-500">(Zero Values)</span>
              )}
            </h4>
          </div>
          <div className="max-h-[400px] space-y-3 overflow-auto p-3 text-xs">
            <div className="flex gap-2">
              <span className="font-medium">Chart Type:</span> {chartType}
              <span className="ml-2 font-medium">Comparison:</span>{' '}
              {isComparing ? 'Yes' : 'No'}
            </div>

            {!hasAllRequiredProps && (
              <div className="rounded border border-red-300 bg-red-50 p-2 text-red-600">
                <span className="font-medium">Missing properties:</span>{' '}
                {missingProps.join(', ')}
              </div>
            )}

            {hasZeroValues && (
              <div className="rounded border border-amber-300 bg-amber-50 p-2 text-amber-600">
                <span className="font-medium">Warning:</span> All data values
                are zero or null
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Data Sample:</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(data[0], null, 2), true)
                  }
                  aria-label="Copy data sample to clipboard"
                >
                  {copiedSample ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <pre className="mt-1 max-h-32 overflow-auto rounded bg-zinc-100 p-2 text-[10px]">
                {JSON.stringify(data[0], null, 2)}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Full Dataset:</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(data, null, 2), false)
                  }
                  aria-label="Copy full dataset to clipboard"
                >
                  {copiedFull ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <pre className="mt-1 max-h-32 overflow-auto rounded bg-zinc-100 p-2 text-[10px]">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ChartDebugger;
