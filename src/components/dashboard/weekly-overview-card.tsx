import { Button } from '@/components/ui/button';
import { BarChart3, Clock } from 'lucide-react';
import { DashboardCard } from './dashboard-card';

interface WeeklyOverviewCardProps {
  onRefresh: () => void;
  isFetching: boolean;
}

export function WeeklyOverviewCard({
  onRefresh,
  isFetching,
}: WeeklyOverviewCardProps) {
  const refreshButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={onRefresh}
      disabled={isFetching}
    >
      {isFetching ? (
        <Clock className="h-4 w-4 animate-spin" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <DashboardCard
      title="Weekly Overview"
      description="Pharmacy performance for the past week"
      className="col-span-4"
      action={refreshButton}
      isLoading={false}
    >
      <div className="flex h-[240px] items-center justify-center">
        <BarChart3 className="text-muted-foreground/30 h-16 w-16" />
      </div>
    </DashboardCard>
  );
}
