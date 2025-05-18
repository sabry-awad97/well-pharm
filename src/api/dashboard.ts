import { createComponentLogger } from '@/lib/logger';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useOnboardingStatus } from './onboarding';

const dashboardAPILog = createComponentLogger('DashboardAPI');

/**
 * Dashboard statistics data structure
 * @interface DashboardStats
 */
export interface DashboardStats {
  patients: {
    total: number;
    trend: number;
    trendPeriod: string;
  };
  inventory: {
    total: number;
    lowStock: number;
  };
  prescriptions: {
    total: number;
    trend: number;
    trendPeriod: string;
  };
  revenue: {
    total: number;
    trend: number;
    trendPeriod: string;
    currency: string;
  };
}

/**
 * Low stock inventory item
 * @interface InventoryItem
 */
export interface InventoryItem {
  id: string;
  name: string;
  stockLevel: number;
  threshold: number;
  percentRemaining: number;
}

/**
 * Recent patient data
 * @interface RecentPatient
 */
export interface RecentPatient {
  id: string;
  name: string;
  registrationDate: string;
  avatarUrl?: string;
}

/**
 * Recent prescription data
 * @interface RecentPrescription
 */
export interface RecentPrescription {
  id: string;
  patientName: string;
  medicationName: string;
  issueDate: string;
}

/**
 * System alert data
 * @interface SystemAlert
 */
export interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  description: string;
  date: string;
}

/**
 * Complete dashboard data
 * @interface DashboardData
 */
export interface DashboardData {
  stats: DashboardStats;
  lowStockItems: InventoryItem[];
  recentPatients: RecentPatient[];
  recentPrescriptions: RecentPrescription[];
  systemAlerts: SystemAlert[];
}

/**
 * Fetches dashboard statistics
 *
 * Expected backend endpoint: GET /api/dashboard/stats
 *
 * @returns Promise with dashboard statistics
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  dashboardAPILog.info('Fetching dashboard statistics');

  try {
    // In the future, this will call the actual backend API
    // For now, we'll simulate a delay and return mock data
    // await invoke('fetch_dashboard_stats')

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Return mock data
    return {
      patients: {
        total: 1248,
        trend: 12.5,
        trendPeriod: 'month',
      },
      inventory: {
        total: 567,
        lowStock: 4,
      },
      prescriptions: {
        total: 89,
        trend: 4.3,
        trendPeriod: 'week',
      },
      revenue: {
        total: 24680,
        trend: 8.2,
        trendPeriod: 'month',
        currency: 'USD',
      },
    };
  } catch (error) {
    dashboardAPILog.error('Failed to fetch dashboard statistics', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}

/**
 * Fetches low stock inventory items
 *
 * Expected backend endpoint: GET /api/inventory/low-stock
 *
 * @returns Promise with low stock inventory items
 */
export async function fetchLowStockItems(): Promise<InventoryItem[]> {
  dashboardAPILog.info('Fetching low stock inventory items');

  try {
    // In the future, this will call the actual backend API
    // await invoke('fetch_low_stock_items')

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Return mock data
    return [
      {
        id: '1',
        name: 'Paracetamol 500mg',
        stockLevel: 15,
        threshold: 100,
        percentRemaining: 15,
      },
      {
        id: '2',
        name: 'Amoxicillin 250mg',
        stockLevel: 32,
        threshold: 100,
        percentRemaining: 32,
      },
      {
        id: '3',
        name: 'Ibuprofen 400mg',
        stockLevel: 78,
        threshold: 100,
        percentRemaining: 78,
      },
      {
        id: '4',
        name: 'Cetirizine 10mg',
        stockLevel: 8,
        threshold: 100,
        percentRemaining: 8,
      },
    ];
  } catch (error) {
    dashboardAPILog.error('Failed to fetch low stock items', error);
    throw new Error('Failed to fetch low stock inventory items');
  }
}

/**
 * Fetches recent patients
 *
 * Expected backend endpoint: GET /api/patients/recent
 *
 * @param limit Number of patients to fetch
 * @returns Promise with recent patients
 */
export async function fetchRecentPatients(limit = 3): Promise<RecentPatient[]> {
  dashboardAPILog.info('Fetching recent patients', { limit });

  try {
    // In the future, this will call the actual backend API
    // await invoke('fetch_recent_patients', { limit })

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock data
    return Array.from({ length: limit }, (_, i) => ({
      id: `patient-${i + 1}`,
      name: `Patient ${i + 1}`,
      registrationDate: new Date().toISOString(),
    }));
  } catch (error) {
    dashboardAPILog.error('Failed to fetch recent patients', error);
    throw new Error('Failed to fetch recent patients');
  }
}

/**
 * Fetches recent prescriptions
 *
 * Expected backend endpoint: GET /api/prescriptions/recent
 *
 * @param limit Number of prescriptions to fetch
 * @returns Promise with recent prescriptions
 */
export async function fetchRecentPrescriptions(
  limit = 3,
): Promise<RecentPrescription[]> {
  dashboardAPILog.info('Fetching recent prescriptions', { limit });

  try {
    // In the future, this will call the actual backend API
    // await invoke('fetch_recent_prescriptions', { limit })

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));

    // Return mock data
    return Array.from({ length: limit }, (_, i) => ({
      id: `prescription-${i + 1}`,
      patientName: `Patient ${i + 1}`,
      medicationName: `Medication ${i + 1}`,
      issueDate: new Date().toISOString(),
    }));
  } catch (error) {
    dashboardAPILog.error('Failed to fetch recent prescriptions', error);
    throw new Error('Failed to fetch recent prescriptions');
  }
}

/**
 * Fetches system alerts
 *
 * Expected backend endpoint: GET /api/system/alerts
 *
 * @param limit Number of alerts to fetch
 * @returns Promise with system alerts
 */
export async function fetchSystemAlerts(limit = 3): Promise<SystemAlert[]> {
  dashboardAPILog.info('Fetching system alerts', { limit });

  try {
    // In the future, this will call the actual backend API
    // await invoke('fetch_system_alerts', { limit })

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Return mock data
    return [
      {
        id: 'alert-1',
        type: 'warning',
        title: 'Low Stock Alert',
        description: '4 items below threshold',
        date: new Date().toISOString(),
      },
      {
        id: 'alert-2',
        type: 'success',
        title: 'System Update',
        description: 'New version available',
        date: new Date().toISOString(),
      },
      {
        id: 'alert-3',
        type: 'info',
        title: 'Maintenance Notice',
        description: 'Scheduled for next week',
        date: new Date().toISOString(),
      },
    ];
  } catch (error) {
    dashboardAPILog.error('Failed to fetch system alerts', error);
    throw new Error('Failed to fetch system alerts');
  }
}

/**
 * Fetches all dashboard data in parallel
 *
 * @returns Promise with complete dashboard data
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  dashboardAPILog.info('Fetching all dashboard data');

  try {
    // Fetch all data in parallel for better performance
    const [
      stats,
      lowStockItems,
      recentPatients,
      recentPrescriptions,
      systemAlerts,
    ] = await Promise.all([
      fetchDashboardStats(),
      fetchLowStockItems(),
      fetchRecentPatients(),
      fetchRecentPrescriptions(),
      fetchSystemAlerts(),
    ]);

    return {
      stats,
      lowStockItems,
      recentPatients,
      recentPrescriptions,
      systemAlerts,
    };
  } catch (error) {
    dashboardAPILog.error('Failed to fetch dashboard data', error);
    throw new Error('Failed to fetch dashboard data');
  }
}

/**
 * Query keys for dashboard data
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  lowStockItems: () => [...dashboardKeys.all, 'lowStockItems'] as const,
  recentPatients: () => [...dashboardKeys.all, 'recentPatients'] as const,
  recentPrescriptions: () =>
    [...dashboardKeys.all, 'recentPrescriptions'] as const,
  systemAlerts: () => [...dashboardKeys.all, 'systemAlerts'] as const,
};

const log = createComponentLogger('useDashboardData');

/**
 * Custom hook for fetching and managing dashboard data
 */
export function useDashboardData() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if onboarding is completed
  const onboardingCheck = useOnboardingStatus();

  useEffect(() => {
    const isOnboarded = onboardingCheck.data;
    if (!isOnboarded) {
      log.info('Onboarding not completed, redirecting to onboarding page');
      navigate({ to: '/onboarding', replace: true });
    }
  }, [navigate, onboardingCheck]);

  // Fetch all dashboard data
  const dashboardQuery = useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboardData,
    // Only fetch dashboard data if onboarding is completed
    enabled: onboardingCheck.isSuccess && onboardingCheck.data === true,
    // Refetch data every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Stale time of 1 minute
    staleTime: 60 * 1000,
  });

  // Function to manually refresh dashboard data
  const refreshDashboardData = async () => {
    log.info('Manually refreshing dashboard data');

    try {
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      log.info('Dashboard data refresh initiated');
    } catch (error) {
      log.error('Failed to refresh dashboard data', error);
    }
  };

  return {
    // Data states
    isLoading: onboardingCheck.isLoading || dashboardQuery.isLoading,
    isError: onboardingCheck.isError || dashboardQuery.isError,
    error: onboardingCheck.error || dashboardQuery.error,
    data: dashboardQuery.data,

    // Individual data pieces for convenience
    stats: dashboardQuery.data?.stats,
    lowStockItems: dashboardQuery.data?.lowStockItems,
    recentPatients: dashboardQuery.data?.recentPatients,
    recentPrescriptions: dashboardQuery.data?.recentPrescriptions,
    systemAlerts: dashboardQuery.data?.systemAlerts,

    // Actions
    refreshData: refreshDashboardData,

    // Query states
    isFetching: dashboardQuery.isFetching,
  };
}
