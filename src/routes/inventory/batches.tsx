import BatchManagementPage from '@/components/inventory/BatchManagementPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/inventory/batches')({
  component: BatchManagementPage,
});
