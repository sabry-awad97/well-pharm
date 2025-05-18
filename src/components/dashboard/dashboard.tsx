import { useDashboardData } from '@/api/dashboard';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import { useEffect } from 'react';
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

  useEffect(() => {
    log.debug('Dashboard component mounted');
    return () => {
      log.debug('Dashboard component unmounting');
    };
  }, []);

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
    <MainLayout>
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
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
              <CardDescription>
                Pharmacy performance for the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex h-[240px] items-center justify-center">
                Chart will be displayed here
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>
                Low stock items that need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems?.map(item => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">
                        {item.percentRemaining}%
                      </div>
                    </div>
                    <Progress value={item.percentRemaining} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
              <CardDescription>Latest patient registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPatients?.map(patient => (
                  <div key={patient.id} className="flex items-center gap-4">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {patient.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Registered today
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Prescriptions</CardTitle>
              <CardDescription>Latest prescriptions issued</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPrescriptions?.map(prescription => (
                  <div
                    key={prescription.id}
                    className="flex items-center gap-4"
                  >
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Pill className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {prescription.patientName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {prescription.medicationName}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>System notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemAlerts?.map(alert => {
                  // Determine the color based on alert type
                  const alertColor = {
                    warning: 'yellow-500',
                    info: 'blue-500',
                    error: 'red-500',
                    success: 'green-500',
                  }[alert.type];

                  return (
                    <div key={alert.id} className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full bg-${alertColor}/10 text-${alertColor}`}
                      >
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm leading-none font-medium">
                          {alert.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {alert.description}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
