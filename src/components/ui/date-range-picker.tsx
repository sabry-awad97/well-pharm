import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import { addDays, format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

const dateRangePickerVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        compact: 'h-9 px-2 py-1',
      },
      width: {
        default: 'w-full',
        auto: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      width: 'default',
    },
  },
);

export interface DateRangePickerProps
  extends VariantProps<typeof dateRangePickerVariants> {
  value: {
    from: Date | undefined;
    to: Date | undefined;
  };
  onChange: (value: { from: Date | undefined; to: Date | undefined }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
  variant,
  width,
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to format the date range for display
  const formatDateRange = () => {
    if (value.from && value.to) {
      return `${format(value.from, 'MMM dd, yyyy')} - ${format(
        value.to,
        'MMM dd, yyyy',
      )}`;
    }
    if (value.from) {
      return `${format(value.from, 'MMM dd, yyyy')} - ...`;
    }
    return placeholder;
  };

  // Predefined date ranges
  const predefinedRanges = [
    {
      label: 'Today',
      onClick: () => {
        const today = new Date();
        onChange({ from: today, to: today });
      },
    },
    {
      label: 'Yesterday',
      onClick: () => {
        const yesterday = addDays(new Date(), -1);
        onChange({ from: yesterday, to: yesterday });
      },
    },
    {
      label: 'Last 7 days',
      onClick: () => {
        onChange({
          from: addDays(new Date(), -6),
          to: new Date(),
        });
      },
    },
    {
      label: 'Last 30 days',
      onClick: () => {
        onChange({
          from: addDays(new Date(), -29),
          to: new Date(),
        });
      },
    },
    {
      label: 'This month',
      onClick: () => {
        const today = new Date();
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        );
        onChange({
          from: firstDayOfMonth,
          to: today,
        });
      },
    },
    {
      label: 'Clear',
      onClick: () => {
        onChange({ from: undefined, to: undefined });
      },
    },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            dateRangePickerVariants({ variant, width }),
            'justify-start text-left font-normal',
            !value.from && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col space-y-2 p-2">
          <div className="flex flex-wrap gap-1">
            {predefinedRanges.map(range => (
              <Button
                key={range.label}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  range.onClick();
                  if (range.label !== 'Clear') {
                    setIsOpen(false);
                  }
                }}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <div className="border-t pt-2">
            <Calendar
              mode="range"
              selected={{
                from: value.from,
                to: value.to,
              }}
              onSelect={range => {
                onChange({
                  from: range?.from,
                  to: range?.to ?? range?.from,
                });
                if (range?.from && range?.to) {
                  setIsOpen(false);
                }
              }}
              numberOfMonths={2}
              disabled={disabled}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
