import { useOnboardingStatus } from "@/api/onboarding";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
});

function OnboardingPage() {
	const { data: isOnboarded, isLoading, error } = useOnboardingStatus();

	// If onboarding is already completed, redirect to home
	if (isOnboarded) {
		throw redirect({ to: "/" });
	}

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<span className="ml-2">Checking onboarding status...</span>
			</div>
		);
	}

	// Show error state
	if (error) {
		return (
			<div className="flex h-screen flex-col items-center justify-center text-destructive">
				<p>Error checking onboarding status:</p>
				<p className="font-mono">{String(error)}</p>
			</div>
		);
	}

	// Render the onboarding flow
	return <OnboardingFlow />;
}
