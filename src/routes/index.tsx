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
import { cn } from '@/lib/utils';
import { createFileRoute } from '@tanstack/react-router';
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

export const Route = createFileRoute('/')({
  component: Dashboard,
});

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="bg-primary/10 text-primary h-8 w-8 rounded-md p-1.5">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-muted-foreground flex items-center text-xs">
          {trend && (
            <span
              className={cn(
                'mr-1 flex items-center',
                trend === 'up' && 'text-green-500',
                trend === 'down' && 'text-red-500',
              )}
            >
              {trend === 'up' && <TrendingUp className="mr-1 h-3 w-3" />}
              {trend === 'down' && (
                <TrendingUp className="mr-1 h-3 w-3 rotate-180" />
              )}
              {trendValue}
            </span>
          )}
          {description}
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 0,
    inventory: 0,
    prescriptions: 0,
    revenue: 0,
  });

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const isOnboarded = await invoke('check_onboarding_status');
        if (!isOnboarded) {
          // Redirect to onboarding if not completed
          window.location.href = '/onboarding';
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      } finally {
        setIsLoading(false);

        // Mock data for demonstration
        setStats({
          patients: 1248,
          inventory: 567,
          prescriptions: 89,
          revenue: 24680,
        });
      }
    };

    checkOnboarding();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2" />
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
            <Button variant="default" size="sm" className="gap-1">
              <Clock className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Patients"
            value={stats.patients.toString()}
            description="since last month"
            icon={<Users className="h-5 w-5" />}
            trend="up"
            trendValue="+12.5%"
          />
          <StatCard
            title="Inventory Items"
            value={stats.inventory.toString()}
            description="in stock"
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Prescriptions"
            value={stats.prescriptions.toString()}
            description="this week"
            icon={<Pill className="h-5 w-5" />}
            trend="up"
            trendValue="+4.3%"
          />
          <StatCard
            title="Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            description="this month"
            icon={<TrendingUp className="h-5 w-5" />}
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
              <CardTitle>Upcoming Refills</CardTitle>
              <CardDescription>Prescriptions due for refill</CardDescription>
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
                        Prescription #{1000 + i}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Due in {i} day{i > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Process
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>System notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-none font-medium">
                      Inventory Alert
                    </p>
                    <p className="text-muted-foreground text-xs">
                      5 items below threshold
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-none font-medium">
                      Delivery Arrived
                    </p>
                    <p className="text-muted-foreground text-xs">
                      New stock ready for processing
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Process
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-none font-medium">
                      Staff Meeting
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Scheduled for tomorrow at 9 AM
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Details
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
