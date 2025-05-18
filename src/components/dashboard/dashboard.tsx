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
import { useNavigate } from '@tanstack/react-router';
import { invoke } from '@tauri-apps/api/core';
import {
  AlertCircle,
  Calendar,
  Clock,
  Package,
  Pill,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatCard } from './stat-card';

// Create a component-specific logger
const log = createComponentLogger('Dashboard');

interface DashboardStats {
  patients: number;
  inventory: number;
  prescriptions: number;
  revenue: number;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    patients: 0,
    inventory: 0,
    prescriptions: 0,
    revenue: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    log.debug('Dashboard component mounted');

    const checkOnboarding = async () => {
      try {
        log.info('Checking onboarding status');
        const isOnboarded = await invoke<boolean>('check_onboarding_status');

        if (!isOnboarded) {
          log.info('Onboarding not completed, redirecting to onboarding page');
          navigate({ to: '/onboarding', replace: true });
          return;
        }

        log.info('Onboarding completed, loading dashboard data');

        // In a real app, we would fetch actual data from the backend
        // For now, we're using mock data
        setStats({
          patients: 1248,
          inventory: 567,
          prescriptions: 89,
          revenue: 24680,
        });

        log.debug('Dashboard data loaded successfully', { stats });
      } catch (err) {
        log.error(
          'Failed to check onboarding status or load dashboard data',
          err,
        );
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();

    return () => {
      log.debug('Dashboard component unmounting');
    };
  }, [navigate, stats]);

  const handleRefresh = () => {
    log.info('Manual refresh requested');
    setIsLoading(true);

    // Simulate a refresh by setting a timeout
    setTimeout(() => {
      // Update stats with slightly different values to simulate real data changes
      setStats(prevStats => ({
        patients: prevStats.patients + Math.floor(Math.random() * 10),
        inventory: prevStats.inventory + Math.floor(Math.random() * 5),
        prescriptions: prevStats.prescriptions + Math.floor(Math.random() * 3),
        revenue: prevStats.revenue + Math.floor(Math.random() * 1000),
      }));

      setIsLoading(false);
      log.info('Dashboard data refreshed');
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="text-destructive h-12 w-12" />
        <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
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
              disabled={isLoading}
            >
              <Clock className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Patients"
            value={stats.patients.toString()}
            description="since last month"
            icon={<Users className="h-3.5 w-3.5" />}
            trend="up"
            trendValue="+12.5%"
          />
          <StatCard
            title="Inventory Items"
            value={stats.inventory.toString()}
            description="in stock"
            icon={<Package className="h-3.5 w-3.5" />}
          />
          <StatCard
            title="Prescriptions"
            value={stats.prescriptions.toString()}
            description="this week"
            icon={<Pill className="h-3.5 w-3.5" />}
            trend="up"
            trendValue="+4.3%"
          />
          <StatCard
            title="Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            description="this month"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            trend="up"
            trendValue="+8.2%"
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">Paracetamol 500mg</div>
                    <div className="text-muted-foreground">15%</div>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">Amoxicillin 250mg</div>
                    <div className="text-muted-foreground">32%</div>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">Ibuprofen 400mg</div>
                    <div className="text-muted-foreground">78%</div>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">Cetirizine 10mg</div>
                    <div className="text-muted-foreground">8%</div>
                  </div>
                  <Progress value={8} className="h-2" />
                </div>
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
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-none font-medium">
                        Patient {i}
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
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Pill className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-none font-medium">
                        Prescription {i}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Issued today
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
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-none font-medium">
                      Low Stock Alert
                    </p>
                    <p className="text-muted-foreground text-xs">
                      4 items below threshold
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-none font-medium">
                      System Update
                    </p>
                    <p className="text-muted-foreground text-xs">
                      New version available
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-none font-medium">
                      Maintenance Notice
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Scheduled for next week
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}


