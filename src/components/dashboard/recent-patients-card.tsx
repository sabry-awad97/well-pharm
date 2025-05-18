import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { DashboardCard } from './dashboard-card';

interface RecentPatient {
  id: string;
  name: string;
  registrationDate: string;
  avatarUrl?: string;
}

interface RecentPatientsCardProps {
  recentPatients?: RecentPatient[];
}

export function RecentPatientsCard({
  recentPatients,
}: RecentPatientsCardProps) {
  const isEmpty = !recentPatients || recentPatients.length === 0;

  return (
    <DashboardCard
      title="Recent Patients"
      description="Latest patient registrations"
      isEmpty={isEmpty}
      emptyState={
        <div className="text-center">
          <Users className="text-muted-foreground/50 mx-auto h-8 w-8" />
          <p className="text-muted-foreground mt-2 text-sm">
            No recent patients
          </p>
        </div>
      }
    >
      <div className="space-y-4">
        {recentPatients?.map(patient => (
          <div key={patient.id} className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full">
              <Users className="text-primary h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm leading-none font-medium">{patient.name}</p>
              <p className="text-muted-foreground text-xs">Registered today</p>
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
