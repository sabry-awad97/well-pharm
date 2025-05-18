import { Button } from '@/components/ui/button';
import { Pill } from 'lucide-react';
import { DashboardCard } from './dashboard-card';

interface RecentPrescription {
  id: string;
  patientName: string;
  medicationName: string;
  issueDate: string;
}

interface RecentPrescriptionsCardProps {
  recentPrescriptions?: RecentPrescription[];
}

export function RecentPrescriptionsCard({
  recentPrescriptions,
}: RecentPrescriptionsCardProps) {
  const isEmpty = !recentPrescriptions || recentPrescriptions.length === 0;

  return (
    <DashboardCard
      title="Recent Prescriptions"
      description="Latest prescriptions issued"
      isEmpty={isEmpty}
      emptyState={
        <div className="text-center">
          <Pill className="text-muted-foreground/50 mx-auto h-8 w-8" />
          <p className="text-muted-foreground mt-2 text-sm">
            No recent prescriptions
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        {recentPrescriptions?.map(prescription => (
          <div key={prescription.id} className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
              <Pill className="text-primary h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm leading-none font-medium">
                {prescription.patientName}
              </p>
              <p className="text-muted-foreground text-xs">
                {prescription.medicationName}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-8">
              View
            </Button>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
