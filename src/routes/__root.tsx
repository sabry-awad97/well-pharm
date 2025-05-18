import {
  Outlet,
  createRootRouteWithContext,
  redirect,
} from '@tanstack/react-router';

import TanStackQueryLayout from '@/integrations/tanstack-query/layout.tsx';
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { checkOnboardingStatus } from '@/api/onboarding';
import { Toaster } from '@/components/ui/sonner';
import type { QueryClient } from '@tanstack/react-query';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  beforeLoad: async ({ location, context }) => {
    // Skip onboarding check if already on the onboarding page
    if (location.pathname === '/onboarding') {
      return;
    }

    try {
      // Use the queryClient to prefetch the onboarding status
      const queryClient = context.queryClient;

      // Check onboarding status
      const isOnboarded = await checkOnboardingStatus();

      // Store the result in the query cache for components to use
      queryClient.setQueryData(['onboarding', 'status'], isOnboarded);

      // If not onboarded, redirect to onboarding page
      if (!isOnboarded) {
        throw redirect({
          to: '/onboarding',
        });
      }
    } catch (error) {
      // Check if the error is a redirect
      if (error && typeof error === 'object' && 'isRedirect' in error) {
        // Rethrow redirects to let the router handle them
        throw error;
      }

      // Log other errors but don't block rendering
      console.error('Failed to check onboarding status:', error);
    }
  },
});

function RootComponent() {
  return (
    <>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
      <TanStackQueryLayout />
      <Toaster richColors expand />
    </>
  );
}
