import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Bug, Check, Copy } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface DebugPanelProps {
  /**
   * The data to be debugged
   */
  data: unknown;
  /**
   * Name of the component being debugged (for display purposes)
   */
  componentName?: string;
  /**
   * Optional validation function to check if data meets expected criteria
   */
  validate?: (data: unknown) => { isValid: boolean; issues?: string[] };
  /**
   * Custom icon to use for the debug button
   */
  icon?: React.ReactNode;
  /**
   * Additional CSS classes for the debug button
   */
  buttonClassName?: string;
  /**
   * Position of the debug button
   */
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'inline';
  /**
   * Whether to show a sample of the data or the full data
   */
  showSample?: boolean;
  /**
   * Additional information to display in the debug panel
   */
  additionalInfo?: Record<string, React.ReactNode>;
}

/**
 * A reusable debugging utility component that only renders in development mode.
 * Provides a consistent UI for debugging data across the application.
 */
export function DebugPanel({
  data,
  componentName = 'Component',
  validate,
  icon,
  buttonClassName,
  position = 'top-right',
  showSample = true,
  additionalInfo,
}: DebugPanelProps) {
  // Only render in development mode
  if (process.env.NODE_ENV === 'production') return null;

  const [copiedSample, setCopiedSample] = React.useState(false);
  const [copiedFull, setCopiedFull] = React.useState(false);

  // Run validation if provided
  const validation = validate ? validate(data) : { isValid: true };
  const { isValid, issues } = validation;

  // Determine the appropriate icon based on validation results
  const debugIcon = React.useMemo(() => {
    if (icon) return icon;
    if (!isValid)
      return <span className="text-xs font-bold text-amber-600">⚠️</span>;
    return <Bug className="text-muted-foreground h-4 w-4" />;
  }, [icon, isValid]);

  // Position classes
  const positionClasses = {
    'top-right': 'absolute top-2 right-2 z-10',
    'top-left': 'absolute top-2 left-2 z-10',
    'bottom-right': 'absolute bottom-2 right-2 z-10',
    'bottom-left': 'absolute bottom-2 left-2 z-10',
    inline: '',
  };

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

  // Get a sample of the data if it's an array
  const dataSample = React.useMemo(() => {
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return data;
  }, [data]);

  return (
    <div className={position !== 'inline' ? positionClasses[position] : ''}>
      <Popover>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    'h-6 w-6 rounded-full border-amber-200 bg-amber-50 hover:bg-amber-100',
                    !isValid && 'border-amber-300 bg-amber-100',
                    buttonClassName,
                  )}
                >
                  <span className="sr-only">Open debug panel</span>
                  {debugIcon}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Debug {componentName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="border-border/50 border-b p-3">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              {componentName} Debug Info
              {!isValid && (
                <span className="text-xs text-amber-500">⚠️ Issues Found</span>
              )}
            </h4>
          </div>
          <div className="max-h-[400px] space-y-3 overflow-auto p-3 text-xs">
            {/* Display additional info if provided */}
            {additionalInfo && (
              <div className="flex flex-col gap-2">
                {Object.entries(additionalInfo).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-medium">{key}:</span>{' '}
                    {typeof value === 'string'
                      ? value
                      : React.isValidElement(value)
                        ? value
                        : String(value)}
                  </div>
                ))}
              </div>
            )}

            {/* Display validation issues if any */}
            {!isValid && issues && issues.length > 0 && (
              <div className="rounded border border-red-300 bg-red-50 p-2 text-red-600">
                <span className="font-medium">Issues:</span>
                <ul className="ml-4 list-disc">
                  {issues.map((issue, index) => (
                    <li
                      key={`issue${index}-${issue.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Display data sample if enabled */}
            {showSample && (
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Data Sample:</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(dataSample, null, 2), true)
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
                  {JSON.stringify(dataSample, null, 2)}
                </pre>
              </div>
            )}

            {/* Display full data */}
            <div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Full Data:</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(data, null, 2), false)
                  }
                  aria-label="Copy full data to clipboard"
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
}
