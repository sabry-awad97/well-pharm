import { createComponentLogger } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';

const log = createComponentLogger('api:finance');

export interface RevenueExpenseData {
  month: string;
  revenue: number;
  expense: number;
}

// Mock data for demonstration purposes
// In a real implementation, this would be replaced with an actual API call
const getMockRevenueExpenseData = async (): Promise<RevenueExpenseData[]> => {
  log.debug('Fetching revenue and expense data');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return months.map(month => ({
    month,
    revenue: Math.floor(Math.random() * 5000) + 3000,
    expense: Math.floor(Math.random() * 4000) + 2000,
  }));
};

export function useRevenueExpenseData(period: 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: ['finance', 'revenue-expense', period],
    queryFn: getMockRevenueExpenseData,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
