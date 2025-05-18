import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  CalendarIcon,
  DownloadIcon,
  LineChartIcon,
  Scale,
} from 'lucide-react';
import { useState } from 'react';
import { getStartOfWeek } from './utils';

// Chart Controls Component
interface ChartControlsProps {
  currentStartDate: Date;
  setCurrentStartDate: React.Dispatch<React.SetStateAction<Date>>;
  chartType: 'bar' | 'line';
  setChartType: React.Dispatch<React.SetStateAction<'bar' | 'line'>>;
  isComparing: boolean;
  setIsComparing: React.Dispatch<React.SetStateAction<boolean>>;
  handleDateChange: (direction: 'prev' | 'next') => void;
  handleExport: () => void;
  isLoading: boolean;
}

function ChartControls({
  currentStartDate,
  setCurrentStartDate,
  chartType,
  setChartType,
  isComparing,
  setIsComparing,
  handleDateChange,
  handleExport,
  isLoading,
}: ChartControlsProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentStartDate(getStartOfWeek(date));
      setIsCalendarOpen(false);
    }
  };

  return (
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
              disabled={isLoading}
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
            disabled={isLoading}
            aria-label="Previous week"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange('next')}
            disabled={isLoading}
            aria-label="Next week"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {/* Chart Type Toggle */}
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
            disabled={isLoading}
            className="px-2 sm:px-3"
          >
            <BarChart2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Bar</span>
          </Button>
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
            className="px-2 sm:px-3"
          >
            <DownloadIcon className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChartControls;
