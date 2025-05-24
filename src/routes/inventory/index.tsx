import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/inventory/')({
  beforeLoad: () => {
    // Redirect to the main inventory management page
    throw redirect({ to: '/inventory/management' });
  },
});
