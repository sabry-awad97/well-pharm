import {
	Outlet,
	createRootRouteWithContext,
	redirect,
} from "@tanstack/react-router";

import TanStackQueryLayout from "@/integrations/tanstack-query/layout.tsx";
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { checkAuth } from "@/api/auth";
import { checkOnboardingStatus } from "@/api/onboarding";
import { Toaster } from "@/components/ui/sonner";
import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
	queryClient: QueryClient;
}

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/onboarding"];

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
				console.log("Not onboarded, redirecting to onboarding");
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

			// If not in cache, check auth status
			if (isAuthenticated === undefined) {
				isAuthenticated = await checkAuth();
				// Store the result in the query cache for components to use
				queryClient.setQueryData(['auth', 'session'], isAuthenticated);
			}

			// If not authenticated, redirect to login page
			if (!isAuthenticated) {
				console.log("Not authenticated, redirecting to login");
				throw redirect({
					to: '/login',
				});
			}

			console.log("Authentication check passed, continuing to requested route");
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
	return (
		<>
			<Outlet />
			{/* <TanStackRouterDevtools /> */}
			<TanStackQueryLayout />
			<Toaster richColors expand />
		</>
	);
}

