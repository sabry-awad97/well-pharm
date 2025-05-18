import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { DashboardCard } from './dashboard-card';

interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  description: string;
  date: string;
}

interface AlertsCardProps {
  systemAlerts?: SystemAlert[];
}

export function AlertsCard({ systemAlerts }: AlertsCardProps) {
  const isEmpty = !systemAlerts || systemAlerts.length === 0;

  return (
    <DashboardCard
      title="Alerts"
      description="System notifications and alerts"
      isEmpty={isEmpty}
      emptyState={
        <div className="text-center">
          <AlertCircle className="text-muted-foreground/50 mx-auto h-8 w-8" />
          <p className="text-muted-foreground mt-2 text-sm">No system alerts</p>
        </div>
      }
    >
      <div className="space-y-4">
        {systemAlerts?.map(alert => {
          const alertStyles = {
            warning: {
              bg: 'bg-yellow-500/10',
              text: 'text-yellow-500',
            },
            info: {
              bg: 'bg-blue-500/10',
              text: 'text-blue-500',
            },
            error: {
              bg: 'bg-red-500/10',
              text: 'text-red-500',
            },
            success: {
              bg: 'bg-green-500/10',
              text: 'text-green-500',
            },
          }[alert.type];

          return (
            <div key={alert.id} className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full',
                  alertStyles.bg,
                  alertStyles.text,
                )}
              >
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm leading-none font-medium">
                  {alert.title}
                </p>
                <p className="text-muted-foreground text-xs">
                  {alert.description}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-8">
                View
              </Button>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
