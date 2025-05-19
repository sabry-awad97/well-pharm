import { createComponentLogger } from '@/lib/logger';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import React from 'react';

const overviewAPILog = createComponentLogger('api:overview');

// Mock API data structure
export interface DailyData {
  day: string;
  currentPrescriptions: number;
  previousPrescriptions: number;
  currentRevenue: number;
  previousRevenue: number;
}

// Query keys for overview data
export const overviewKeys = {
  all: ['overview'] as const,
  weekly: () => [...overviewKeys.all, 'weekly'] as const,
  weeklyData: (startDate: string) =>
    [...overviewKeys.weekly(), startDate] as const,
};

/**
 * Fetches weekly overview data for the dashboard
 *
 * @param startDate The start date of the week to fetch data for
 * @returns Promise with the weekly data
 */
export async function fetchWeeklyOverviewData(
  startDate: Date,
): Promise<DailyData[]> {
  overviewAPILog.info(`Fetching weekly data for: ${startDate.toDateString()}`);

  try {
    // In the future, this will call the actual backend API via Tauri
    // For example: await invoke('fetch_weekly_data', { startDate: startDate.toISOString() })

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 750));

    // Simulate potential API error (uncomment to test error handling)
    // if (Math.random() > 0.8) {
    //   throw new Error('Failed to fetch weekly data. Please try again.');
    // }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => {
      const currentPrescriptions =
        Math.floor(Math.random() * ((startDate.getDate() % 10) + 1) * 15) + 20;
      const previousPrescriptions = Math.floor(currentPrescriptions * 0.9);
      // Generate revenue based on prescriptions with some variability
      const currentRevenue = currentPrescriptions * (Math.random() * 50 + 100);
      const previousRevenue =
        previousPrescriptions * (Math.random() * 50 + 100);

      return {
        day,
        currentPrescriptions,
        previousPrescriptions,
        currentRevenue: Math.round(currentRevenue),
        previousRevenue: Math.round(previousRevenue),
      };
    });
  } catch (error) {
    overviewAPILog.error('Failed to fetch weekly overview data', error);
    throw new Error('Failed to fetch weekly overview data');
  }
}

/**
 * Hook for fetching weekly overview data
 *
 * @param startDate The start date of the week to fetch data for
 * @param options Additional query options
 * @returns Query result with weekly overview data
 */
export function useWeeklyOverviewData(
  startDate: Date,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
  },
) {
  return useQuery<DailyData[]>({
    queryKey: overviewKeys.weeklyData(startDate.toISOString()),
    queryFn: () => fetchWeeklyOverviewData(startDate),
    placeholderData: keepPreviousData,
    staleTime: options?.staleTime ?? 60 * 1000, // Default 1 minute stale time
    refetchInterval: options?.refetchInterval ?? false,
    enabled: options?.enabled ?? true,
    retry: failureCount => {
      // Don't retry more than 3 times
      return failureCount < 3;
    },
  });
}

/**
 * Hook for comparing weekly overview data between current and previous week
 *
 * @param currentStartDate The start date of the current week
 * @param options Additional query options
 * @returns Object containing both current and previous week query results
 */
export function useCompareWeeklyOverviewData(
  currentStartDate: Date,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
    onSuccess?: (currentData: DailyData[], previousData: DailyData[]) => void;
    onError?: (error: Error) => void;
  },
) {
  // Calculate previous week start date
  const prevWeekStartDate = new Date(currentStartDate);
  prevWeekStartDate.setDate(currentStartDate.getDate() - 7);

  // Query for current week data
  const currentWeekQuery = useWeeklyOverviewData(currentStartDate, options);

  // Query for previous week data
  const previousWeekQuery = useWeeklyOverviewData(prevWeekStartDate, options);

  // Call the combined success handler when both queries succeed
  React.useEffect(() => {
    if (
      options?.onSuccess &&
      currentWeekQuery.isSuccess &&
      previousWeekQuery.isSuccess &&
      currentWeekQuery.data &&
      previousWeekQuery.data
    ) {
      options.onSuccess(currentWeekQuery.data, previousWeekQuery.data);
    }
  }, [
    currentWeekQuery.isSuccess,
    previousWeekQuery.isSuccess,
    currentWeekQuery.data,
    previousWeekQuery.data,
    options,
  ]);

  // Call the error handler if either query fails
  React.useEffect(() => {
    if (options?.onError) {
      if (currentWeekQuery.error) {
        options.onError(currentWeekQuery.error as Error);
      } else if (previousWeekQuery.error) {
        options.onError(previousWeekQuery.error as Error);
      }
    }
  }, [currentWeekQuery.error, previousWeekQuery.error, options]);

  return {
    currentWeek: currentWeekQuery,
    previousWeek: previousWeekQuery,
    isLoading: currentWeekQuery.isLoading || previousWeekQuery.isLoading,
    isFetching: currentWeekQuery.isFetching || previousWeekQuery.isFetching,
    isError: currentWeekQuery.isError || previousWeekQuery.isError,
    error: currentWeekQuery.error || previousWeekQuery.error,
    isPlaceholderData:
      currentWeekQuery.isPlaceholderData || previousWeekQuery.isPlaceholderData,
    refetch: () => {
      currentWeekQuery.refetch();
      previousWeekQuery.refetch();
    },
  };
}
