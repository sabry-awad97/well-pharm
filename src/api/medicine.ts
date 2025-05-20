import { createComponentLogger } from '@/lib/logger';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

const medicineAPILog = createComponentLogger('MedicineAPI');

// Schema definitions
export const TopSellingMedicineSchema = z.object({
  id: z.string(),
  name: z.string(),
  salesCount: z.number(),
  percentageShare: z.number(),
  trend: z.number().optional(),
  category: z.string().optional(),
});

export type TopSellingMedicine = z.infer<typeof TopSellingMedicineSchema>;

// Query keys
export const medicineKeys = {
  all: ['medicines'] as const,
  topSelling: () => [...medicineKeys.all, 'topSelling'] as const,
  topSellingData: (period: string, limit: number) =>
    [...medicineKeys.topSelling(), period, limit] as const,
};

/**
 * Fetches top selling medicines data
 *
 * @param period Time period for the data (e.g., 'week', 'month', 'year')
 * @param limit Maximum number of items to return
 * @returns Promise with top selling medicines data
 */
export async function fetchTopSellingMedicines(
  period = 'month',
  limit = 5,
): Promise<TopSellingMedicine[]> {
  medicineAPILog.info('Fetching top selling medicines', { period, limit });

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('fetch_top_selling_medicines', {
      period,
      limit,
    });

    // Validate the response with Zod schema
    const validatedData = z.array(TopSellingMedicineSchema).parse(response);

    return validatedData;
  } catch (error) {
    // For now, return mock data if the backend command is not implemented
    medicineAPILog.warn('Using mock data for top selling medicines', error);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Return mock data
    return [
      {
        id: '1',
        name: 'Dolo 650',
        salesCount: 1245,
        percentageShare: 78,
        trend: 5.2,
        category: 'Analgesic',
      },
      {
        id: '2',
        name: 'Crocin',
        salesCount: 980,
        percentageShare: 65,
        trend: -2.1,
        category: 'Analgesic',
      },
      {
        id: '3',
        name: 'Azithromycin',
        salesCount: 720,
        percentageShare: 48,
        trend: 3.7,
        category: 'Antibiotic',
      },
      {
        id: '4',
        name: 'Montelukast',
        salesCount: 650,
        percentageShare: 42,
        trend: 1.5,
        category: 'Anti-allergic',
      },
      {
        id: '5',
        name: 'Vitamin D3',
        salesCount: 520,
        percentageShare: 35,
        trend: 8.3,
        category: 'Supplement',
      },
    ].slice(0, limit);
  }
}

/**
 * React Query hook for fetching top selling medicines
 *
 * @param period Time period for the data (e.g., 'week', 'month', 'year')
 * @param limit Maximum number of items to return
 * @param options Additional query options
 * @returns Query result with top selling medicines data
 */
export function useTopSellingMedicines(
  period = 'month',
  limit = 5,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
  },
) {
  return useQuery<TopSellingMedicine[]>({
    queryKey: medicineKeys.topSellingData(period, limit),
    queryFn: () => fetchTopSellingMedicines(period, limit),
    placeholderData: keepPreviousData,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // Default 5 minutes stale time
    refetchInterval: options?.refetchInterval ?? false,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      medicineAPILog.warn('Retrying top selling medicines fetch', {
        failureCount,
        error,
      });
      return failureCount < 3;
    },
  });
}
