import {
	type OnboardingProcess,
	useRunOnboardingProcess,
} from "@/api/onboarding";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DatabaseConfigScreen } from "./screens/database-config-screen";
import { SuccessScreen } from "./screens/success-screen";
import { UserCreationScreen } from "./screens/user-creation-screen";
import { WelcomeScreen } from "./screens/welcome-screen";
import { WorkspaceSetupScreen } from "./screens/workspace-setup-screen";

// Define the steps in the onboarding process
const STEPS = [
	"Welcome",
	"Database Configuration",
	"Admin Account",
	"Workspace Setup",
	"Complete",
];

export function OnboardingFlow() {
	const [currentStep, setCurrentStep] = useState(0);
	const [formData, setFormData] = useState({
		// Database config
		dbHost: "localhost",
		dbPort: "5432",
		dbName: "wellpharm",
		dbUser: "postgres",
		dbPassword: "",

		// Admin user
		adminName: "",
		adminEmail: "",
		adminPassword: "",

		// Workspace
		pharmacyName: "",
		pharmacyAddress: "",
		pharmacyPhone: "",
		pharmacyEmail: "",
		pharmacyLicense: "",
	});

	const navigate = useNavigate();

	// React Query mutations
	const runOnboardingMutation = useRunOnboardingProcess();

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const nextStep = () => {
		if (currentStep < STEPS.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const handleSubmit = async () => {
		// Prepare the data for the onboarding process
		const onboardingData: OnboardingProcess = {
			dbConfig: {
				host: formData.dbHost,
				port: Number.parseInt(formData.dbPort),
				name: formData.dbName,
				user: formData.dbUser,
				password: formData.dbPassword,
			},
			adminUser: {
				name: formData.adminName,
				email: formData.adminEmail,
				password: formData.adminPassword,
			},
			workspaceSettings: {
				name: formData.pharmacyName,
				address: formData.pharmacyAddress,
				phone: formData.pharmacyPhone,
				email: formData.pharmacyEmail,
				license: formData.pharmacyLicense,
			},
		};

		// Run the onboarding process using the mutation
		runOnboardingMutation.mutate(onboardingData, {
			onSuccess: () => {
				// Move to success screen on success
				nextStep();
			},
			onError: (error) => {
				console.error("Onboarding error:", error);
			},
		});
	};

	const finishOnboarding = () => {
		navigate({ to: "/" });
	};

	// Calculate progress percentage
	const progressPercentage = (currentStep / (STEPS.length - 1)) * 100;

	// Render the current step
	const renderStep = () => {
		switch (currentStep) {
			case 0:
				return <WelcomeScreen onNext={nextStep} />;
			case 1:
				return (
					<DatabaseConfigScreen
						formData={formData}
						onChange={handleInputChange}
						onNext={nextStep}
						onBack={prevStep}
					/>
				);
			case 2:
				return (
					<UserCreationScreen
						formData={formData}
						onChange={handleInputChange}
						onNext={nextStep}
						onBack={prevStep}
					/>
				);
			case 3:
				return (
					<WorkspaceSetupScreen
						formData={formData}
						onChange={handleInputChange}
						onSubmit={handleSubmit}
						onBack={prevStep}
						isLoading={runOnboardingMutation.isPending}
						error={
							runOnboardingMutation.error
								? String(runOnboardingMutation.error)
								: null
						}
					/>
				);
			case 4:
				return <SuccessScreen onFinish={finishOnboarding} />;
			default:
				return <WelcomeScreen onNext={nextStep} />;
		}
	};

	return (
		<div className="bg-background flex min-h-screen flex-col">
			<header className="border-b p-4">
				<h1 className="text-2xl font-bold">WellPharm Setup</h1>
			</header>

			<main className="container mx-auto max-w-3xl flex-1 p-6">
				<div className="mb-8">
					<div className="mb-2 flex justify-between">
						{STEPS.map((step, index) => (
							<div
								key={step}
								className={`text-sm ${
									index === currentStep
										? "text-primary font-bold"
										: index < currentStep
											? "text-muted-foreground"
											: "text-muted-foreground/50"
								}`}
							>
								{step}
							</div>
						))}
					</div>
					<Progress value={progressPercentage} className="h-2" />
				</div>

				<div className="bg-card rounded-lg border p-6 shadow-sm">
					{renderStep()}
				</div>
			</main>
		</div>
	);
}
