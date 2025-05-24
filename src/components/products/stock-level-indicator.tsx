import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StockLevelIndicatorProps {
  stockLevel: number;
  threshold: number;
  maxStock: number;
  className?: string;
}

export function StockLevelIndicator({
  stockLevel,
  threshold,
  maxStock,
  className,
}: StockLevelIndicatorProps) {
  const percentage = Math.min(100, Math.round((stockLevel / maxStock) * 100));
  
  let statusColor = "bg-green-500";
  if (stockLevel <= threshold) {
    statusColor = "bg-red-500";
  } else if (stockLevel <= threshold * 2) {
    statusColor = "bg-yellow-500";
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("w-full", className)}>
            <Progress
              value={percentage}
              className="h-2"
              indicatorClassName={statusColor}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Stock: {stockLevel} / {maxStock} units
            {stockLevel <= threshold && (
              <span className="text-red-500 ml-1">(Low stock)</span>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}