import { useDashboardData } from '@/api/dashboard';
import { Button } from '@/components/ui/button';
import { createComponentLogger } from '@/lib/logger';
import {
  AlertCircle,
  Calendar,
  Clock,
  Package,
  Pill,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AlertsCard } from './alerts-card';
import { InventoryStatusCard } from './inventory-status-card';
import { OverviewCard } from './overview-card';
import { RecentPatientsCard } from './recent-patients-card';
import { RecentPrescriptionsCard } from './recent-prescriptions-card';
import { StatCard } from './stat-card';

// Create a component-specific logger
const log = createComponentLogger('Dashboard');

export function Dashboard() {
  const {
    isLoading,
    isError,
    error,
    stats,
    lowStockItems,
    recentPatients,
    recentPrescriptions,
    systemAlerts,
    refreshData,
    isFetching,
  } = useDashboardData();

  const handleRefresh = () => {
    log.info('Manual refresh requested');
    refreshData();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="text-destructive h-12 w-12" />
        <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    );
  }

  // If we get here, we should have data
  if (!stats) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <h2 className="text-xl font-semibold">No Dashboard Data</h2>
        <p className="text-muted-foreground">
          No dashboard data is available. This might be a temporary issue.
        </p>
        <Button onClick={handleRefresh}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to WellPharm management system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-1"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            {isFetching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={stats.patients.total.toString()}
          description={`since last ${stats.patients.trendPeriod}`}
          icon={<Users className="h-3.5 w-3.5" />}
          trend="up"
          trendValue={`+${stats.patients.trend}%`}
        />
        <StatCard
          title="Inventory Items"
          value={stats.inventory.total.toString()}
          description="in stock"
          icon={<Package className="h-3.5 w-3.5" />}
        />
        <StatCard
          title="Prescriptions"
          value={stats.prescriptions.total.toString()}
          description={`this ${stats.prescriptions.trendPeriod}`}
          icon={<Pill className="h-3.5 w-3.5" />}
          trend="up"
          trendValue={`+${stats.prescriptions.trend}%`}
        />
        <StatCard
          title="Revenue"
          value={`$${stats.revenue.total.toLocaleString()}`}
          description={`this ${stats.revenue.trendPeriod}`}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          trend="up"
          trendValue={`+${stats.revenue.trend}%`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <OverviewCard onRefresh={handleRefresh} isFetching={isFetching} />
        <InventoryStatusCard lowStockItems={lowStockItems} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RecentPatientsCard recentPatients={recentPatients} />
        <RecentPrescriptionsCard recentPrescriptions={recentPrescriptions} />
        <AlertsCard systemAlerts={systemAlerts} />
      </div>
    </div>
  );
}
