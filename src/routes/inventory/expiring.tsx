import ExpiringBatchesPage from '@/components/inventory/ExpiringBatchesPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/inventory/expiring')({
  component: ExpiringBatchesPage,
});
