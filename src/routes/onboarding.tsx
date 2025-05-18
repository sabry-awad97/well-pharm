import { useOnboardingStatus } from "@/api/onboarding";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
	beforeLoad: async () => {
		// We'll handle the redirect in the component itself
		// This prevents potential redirect loops
	},
});

function OnboardingPage() {
	const { data: isOnboarded, isLoading, error } = useOnboardingStatus();
	const navigate = useNavigate();

	// Use useEffect for navigation instead of throwing in render
	useEffect(() => {
		if (isOnboarded) {
			navigate({ to: "/" });
		}
	}, [isOnboarded, navigate]);

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="text-primary h-8 w-8 animate-spin" />
				<span className="ml-2">Checking onboarding status...</span>
			</div>
		);
	}

	// Show error state
	if (error) {
		return (
			<div className="text-destructive flex h-screen flex-col items-center justify-center">
				<p>Error checking onboarding status:</p>
				<p className="font-mono">{String(error)}</p>
			</div>
		);
	}

	// Only render the onboarding flow if not already onboarded
	// This prevents a flash of content before redirect
	if (isOnboarded === false) {
		return <OnboardingFlow />;
	}

	// Return a loading state while waiting for the redirect to happen
	return (
		<div className="flex h-screen items-center justify-center">
			<Loader2 className="text-primary h-8 w-8 animate-spin" />
			<span className="ml-2">Preparing application...</span>
		</div>
	);
}
