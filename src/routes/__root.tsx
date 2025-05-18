import {
	Outlet,
	createRootRouteWithContext,
	redirect,
} from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";

import TanStackQueryLayout from "@/integrations/tanstack-query/layout.tsx";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	beforeLoad: async ({ location }) => {
		// Skip onboarding check if already on the onboarding page
		if (location.pathname === "/onboarding") {
			return;
		}

		try {
			const isOnboarded = await invoke("check_onboarding_status");
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
