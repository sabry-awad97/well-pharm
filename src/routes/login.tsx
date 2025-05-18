import { checkAuth } from '@/api/auth';
import { LoginPage } from '@/components/auth/login-page';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/login')({
  component: LoginPageWrapper,
  beforeLoad: async ({ context }) => {
    console.log('Login route: Checking authentication status before loading');

    try {
      // Check if user is already authenticated
      const queryClient = context.queryClient;

      // First check if we already have authentication state in the cache
      let isAuthenticated = queryClient.getQueryData<boolean>([
        'auth',
        'session',
      ]);

      console.log('Login route: Cached auth state:', isAuthenticated);

      // If cached state says not authenticated, trust it
      if (isAuthenticated === false) {
        console.log(
          'Login route: Cached state indicates not authenticated, showing login page',
        );
        return;
      }

      // For all other cases (undefined or true), verify tokens directly
      const hasToken =
        localStorage.getItem('access_token') !== null ||
        sessionStorage.getItem('access_token') !== null;

      console.log('Login route: Direct token check result:', hasToken);

      // If no token found, user is not authenticated
      if (!hasToken) {
        console.log('Login route: No tokens found, showing login page');
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
        console.log(
          'Login route: User is authenticated, redirecting to dashboard',
        );
        throw redirect({
          to: '/',
        });
      }

      console.log('Login route: User is not authenticated, showing login page');
    } catch (error) {
      // Check if the error is a redirect
      if (error && typeof error === 'object' && 'isRedirect' in error) {
        // Rethrow redirects to let the router handle them
        throw error;
      }

      // Log other errors but don't block rendering
      console.error(
        'Login route: Failed to check authentication status:',
        error,
      );
    }
  },
});

function LoginPageWrapper() {
  const navigate = useNavigate();

  // Additional client-side check for authenticated users
  // This handles cases where the authentication state changes after the route is loaded
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isAuthenticated = await checkAuth();

        if (isAuthenticated) {
          console.log(
            'LoginPageWrapper: User is authenticated, redirecting to dashboard',
          );

          // Try to get previous location from history or session storage
          const previousPath = sessionStorage.getItem('previousPath') || '/';

          // Navigate to previous path or dashboard
          navigate({
            to: previousPath,
            replace: true,
          });
        }
      } catch (error) {
        console.error('LoginPageWrapper: Error checking auth status:', error);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  return <LoginPage />;
}
