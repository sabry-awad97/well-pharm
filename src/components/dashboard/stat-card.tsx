import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <Card className="gap-1 overflow-hidden py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2">
        <CardTitle className="text-muted-foreground text-xs font-medium">
          {title}
        </CardTitle>
        <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-md">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-3 py-2">
        <div className="text-lg leading-none font-bold">{value}</div>
        <div className="text-muted-foreground mt-1 flex items-center text-[10px]">
          {trend && (
            <span
              className={cn(
                'mr-1 flex items-center font-medium',
                trend === 'up' && 'text-emerald-500',
                trend === 'down' && 'text-rose-500',
              )}
            >
              <span className="mr-0.5 flex items-center justify-center">
                {trend === 'up' && <TrendingUp className="h-2 w-2" />}
                {trend === 'down' && (
                  <TrendingUp className="h-2 w-2 rotate-180" />
                )}
              </span>
              {trendValue}
            </span>
          )}
          {description}
        </div>
      </CardContent>
    </Card>
  );
}
