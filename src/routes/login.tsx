import { checkAuth } from '@/api/auth';
import { LoginPage } from '@/components/auth/login-page';
import { createContextLogger } from '@/lib/logger';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

// Create a route-specific logger
const LoginRouteLog = createContextLogger('LoginRoute');

export const Route = createFileRoute('/login')({
  component: LoginPageWrapper,
  beforeLoad: async ({ context }) => {
    LoginRouteLog.info('Checking authentication status before loading');

    try {
      // Check if user is already authenticated
      const queryClient = context.queryClient;

      // First check if we already have authentication state in the cache
      let isAuthenticated = queryClient.getQueryData<boolean>([
        'auth',
        'session',
      ]);

      LoginRouteLog.debug('Cached auth state', { isAuthenticated });

      // If cached state says not authenticated, trust it
      if (isAuthenticated === false) {
        LoginRouteLog.info(
          'Cached state indicates not authenticated, showing login page',
        );
        return;
      }

      // For all other cases (undefined or true), verify tokens directly
      const hasToken =
        localStorage.getItem('access_token') !== null ||
        sessionStorage.getItem('access_token') !== null;

      LoginRouteLog.debug('Direct token check result', { hasToken });

      // If no token found, user is not authenticated
      if (!hasToken) {
        LoginRouteLog.info('No tokens found, showing login page');
        // Update cache to match reality
        queryClient.setQueryData(['auth', 'session'], false);
        return;
      }

      // If we have a token, verify it's valid
      isAuthenticated = await checkAuth();

      // Store the result in the query cache for components to use
      queryClient.setQueryData(['auth', 'session'], isAuthenticated);

      // If authenticated, redirect to dashboard
      if (isAuthenticated) {
        LoginRouteLog.info('User is authenticated, redirecting to dashboard');
        throw redirect({
          to: '/',
        });
      }

      LoginRouteLog.info('User is not authenticated, showing login page');
    } catch (error) {
      // Check if the error is a redirect
      if (error && typeof error === 'object' && 'isRedirect' in error) {
        // Rethrow redirects to let the router handle them
        LoginRouteLog.debug('Handling redirect');
        throw error;
      }

      // Log other errors but don't block rendering
      LoginRouteLog.error('Failed to check authentication status', error);
    }
  },
});

const LoginPageWrapperLog = createContextLogger('LoginPageWrapper');

function LoginPageWrapper() {
  const navigate = useNavigate();

  // Additional client-side check for authenticated users
  // This handles cases where the authentication state changes after the route is loaded
  useEffect(() => {
    LoginPageWrapperLog.debug('LoginPageWrapper mounted, checking auth status');

    const checkAuthStatus = async () => {
      try {
        const isAuthenticated = await checkAuth();

        if (isAuthenticated) {
          LoginPageWrapperLog.info(
            'User is authenticated, redirecting to dashboard',
          );

          // Try to get previous location from history or session storage
          const previousPath = sessionStorage.getItem('previousPath') || '/';
          LoginPageWrapperLog.debug('Navigating to previous path', {
            path: previousPath,
          });

          // Navigate to previous path or dashboard
          navigate({
            to: previousPath,
            replace: true,
          });
        } else {
          LoginPageWrapperLog.debug(
            'User is not authenticated, showing login page',
          );
        }
      } catch (error) {
        LoginPageWrapperLog.error('Error checking auth status', error);
      }
    };

    checkAuthStatus();

    return () => {
      LoginPageWrapperLog.debug('LoginPageWrapper unmounting');
    };
  }, [navigate]);

  return <LoginPage />;
}
