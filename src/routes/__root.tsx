import {
  Outlet,
  createRootRouteWithContext,
  redirect,
  useLocation,
} from '@tanstack/react-router';

import TanStackQueryLayout from '@/integrations/tanstack-query/layout.tsx';
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { checkAuth } from '@/api/auth';
import { checkOnboardingStatus } from '@/api/onboarding';
import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from '@/components/ui/sonner';
import { createContextLogger } from '@/lib/logger';
import type { QueryClient } from '@tanstack/react-query';

// Create a route-specific logger
const RootRouteLog = createContextLogger('RootRoute');

interface MyRouterContext {
  queryClient: QueryClient;
}

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/onboarding'];

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  beforeLoad: async ({ location, context }) => {
    const { pathname } = location;
    const queryClient = context.queryClient;

    RootRouteLog.info('Route beforeLoad running', { pathname });

    // Store current path for potential redirects back
    // Don't store login or onboarding paths
    if (!publicRoutes.includes(pathname)) {
      sessionStorage.setItem('previousPath', pathname);
    }

    // Skip checks for public routes
    if (publicRoutes.includes(pathname)) {
      RootRouteLog.debug('Skipping checks for public route', { pathname });
      return;
    }

    try {
      // 1. Check onboarding status first - ALWAYS check directly with the backend
      // after a database reset to ensure we have the latest status
      RootRouteLog.debug('Checking onboarding status');
      const isOnboarded = await checkOnboardingStatus();

      // Store the result in the query cache for components to use
      queryClient.setQueryData(['onboarding', 'status'], isOnboarded);
      RootRouteLog.info('Onboarding status', { isOnboarded });

      // If not onboarded, redirect to onboarding page
      if (!isOnboarded) {
        RootRouteLog.info('Not onboarded, redirecting to onboarding');
        throw redirect({
          to: '/onboarding',
        });
      }

      // 2. Check authentication status after confirming onboarding is complete
      // First check if we already have authentication state in the cache
      let isAuthenticated = queryClient.getQueryData<boolean>([
        'auth',
        'session',
      ]);

      RootRouteLog.debug('Cached auth state', { isAuthenticated });

      // Check for tokens directly
      const hasToken =
        localStorage.getItem('access_token') !== null ||
        sessionStorage.getItem('access_token') !== null;

      RootRouteLog.debug('Direct token check result', { hasToken });

      // If we have conflicting information (cache says not authenticated but tokens exist),
      // we should verify the tokens directly
      if (isAuthenticated === false && hasToken) {
        RootRouteLog.debug('Conflicting auth state, verifying tokens directly');
        isAuthenticated = await checkAuth();
        // Update cache to match reality
        queryClient.setQueryData(['auth', 'session'], isAuthenticated);
        RootRouteLog.debug('Updated auth state after verification', {
          isAuthenticated,
        });
      }

      // If cached state says not authenticated and no tokens, trust it and redirect
      if (isAuthenticated === false && !hasToken) {
        RootRouteLog.info(
          'Not authenticated (from cache and token check), redirecting to login',
        );
        throw redirect({
          to: '/login',
        });
      }

      // If no tokens found, user is not authenticated regardless of cache
      if (!hasToken) {
        RootRouteLog.info('No tokens found, redirecting to login');
        // Update cache to match reality
        queryClient.setQueryData(['auth', 'session'], false);
        throw redirect({
          to: '/login',
        });
      }

      // If we have a token, verify it's valid (unless we already did above)
      if (isAuthenticated !== true) {
        isAuthenticated = await checkAuth();
        // Store the result in the query cache for components to use
        queryClient.setQueryData(['auth', 'session'], isAuthenticated);
      }

      // If not authenticated, redirect to login page
      if (!isAuthenticated) {
        RootRouteLog.info('Not authenticated, redirecting to login');
        throw redirect({
          to: '/login',
        });
      }

      RootRouteLog.info(
        'Authentication check passed, continuing to requested route',
      );
    } catch (error) {
      // Check if the error is a redirect
      if (error && typeof error === 'object' && 'isRedirect' in error) {
        // Rethrow redirects to let the router handle them
        RootRouteLog.debug('Handling redirect', { error });
        throw error;
      }

      // Log other errors but don't block rendering
      RootRouteLog.error('Failed to check application status', { error });
    }
  },
});

function RootComponent() {
  const location = useLocation();
  const pathname = location.pathname;
  const isPublicRoute = publicRoutes.includes(pathname);
  return (
    <>
      {isPublicRoute ? (
        <Outlet />
      ) : (
        <MainLayout>
          <Outlet />
        </MainLayout>
      )}
      <TanStackQueryLayout />
      <Toaster richColors expand />
    </>
  );
}
