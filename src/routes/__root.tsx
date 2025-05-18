import {
	Outlet,
	createRootRouteWithContext,
	redirect,
} from "@tanstack/react-router";

import TanStackQueryLayout from "@/integrations/tanstack-query/layout.tsx";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { checkOnboardingStatus } from "@/api/onboarding";
import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	beforeLoad: async ({ location, context }) => {
		// Skip onboarding check if already on the onboarding page
		if (location.pathname === "/onboarding") {
			return;
		}

		try {
			// Use the queryClient to prefetch the onboarding status
			// This ensures we have the data in the cache for components that need it
			const queryClient = context.queryClient;

			// We still need to use the direct function here since hooks can't be used in beforeLoad
			const isOnboarded = await checkOnboardingStatus();

			// Store the result in the query cache for components to use
			queryClient.setQueryData(["onboarding", "status"], isOnboarded);

			if (!isOnboarded) {
				throw redirect({
					to: "/onboarding",
				});
			}
		} catch (error) {
			// If the error is a redirect, throw it
			if (error instanceof Error && error.name === "RedirectError") {
				throw error;
			}
			// Otherwise log the error and continue
			console.error("Failed to check onboarding status:", error);
		}
	},
});

function RootComponent() {
	return (
		<>
			<Outlet />
			<TanStackRouterDevtools />
			<TanStackQueryLayout />
		</>
	);
}
