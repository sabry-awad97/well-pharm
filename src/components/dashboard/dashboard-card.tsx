import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export interface DashboardCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  action?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyState?: ReactNode;
}

export function DashboardCard({
  title,
  description,
  children,
  className,
  contentClassName,
  headerClassName,
  action,
  isLoading = false,
  isEmpty = false,
  emptyState,
}: DashboardCardProps) {
  return (
    <Card className={cn('overflow-hidden shadow-sm', className)}>
      <CardHeader
        className={cn(
          'flex flex-row items-start justify-between space-y-0 pb-4',
          headerClassName,
        )}
      >
        <div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1 text-xs">
              {description}
            </CardDescription>
          )}
        </div>
        {action && <div className="ml-auto">{action}</div>}
      </CardHeader>
      <CardContent className={cn('px-6 pt-0 pb-4', contentClassName)}>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="flex h-32 flex-col items-center justify-center text-center">
            {emptyState || (
              <div className="text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
