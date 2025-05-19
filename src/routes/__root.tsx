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
import type { QueryClient } from '@tanstack/react-query';

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

    // Store current path for potential redirects back
    // Don't store login or onboarding paths
    if (!publicRoutes.includes(pathname)) {
      sessionStorage.setItem('previousPath', pathname);
    }

    // Skip checks for public routes
    if (publicRoutes.includes(pathname)) {
      return;
    }

    try {
      // 1. Check onboarding status first
      const isOnboarded = await checkOnboardingStatus();

      // Store the result in the query cache for components to use
      queryClient.setQueryData(['onboarding', 'status'], isOnboarded);

      // If not onboarded, redirect to onboarding page
      if (!isOnboarded) {
        console.log('Not onboarded, redirecting to onboarding');
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

      console.log('Root route: Cached auth state:', isAuthenticated);

      // Check for tokens directly
      const hasToken =
        localStorage.getItem('access_token') !== null ||
        sessionStorage.getItem('access_token') !== null;

      console.log('Root route: Direct token check result:', hasToken);

      // If we have conflicting information (cache says not authenticated but tokens exist),
      // we should verify the tokens directly
      if (isAuthenticated === false && hasToken) {
        console.log(
          'Root route: Conflicting auth state, verifying tokens directly',
        );
        isAuthenticated = await checkAuth();
        // Update cache to match reality
        queryClient.setQueryData(['auth', 'session'], isAuthenticated);
        console.log(
          'Root route: Updated auth state after verification:',
          isAuthenticated,
        );
      }

      // If cached state says not authenticated and no tokens, trust it and redirect
      if (isAuthenticated === false && !hasToken) {
        console.log(
          'Not authenticated (from cache and token check), redirecting to login',
        );
        throw redirect({
          to: '/login',
        });
      }

      // If no tokens found, user is not authenticated regardless of cache
      if (!hasToken) {
        console.log('No tokens found, redirecting to login');
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
        console.log('Not authenticated, redirecting to login');
        throw redirect({
          to: '/login',
        });
      }

      console.log('Authentication check passed, continuing to requested route');
    } catch (error) {
      // Check if the error is a redirect
      if (error && typeof error === 'object' && 'isRedirect' in error) {
        // Rethrow redirects to let the router handle them
        throw error;
      }

      // Log other errors but don't block rendering
      console.error('Failed to check application status:', error);
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
