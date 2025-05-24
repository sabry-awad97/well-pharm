import InventoryManagementPage from '@/components/inventory/InventoryManagementPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/inventory/management')({
  component: InventoryManagementPage,
});
