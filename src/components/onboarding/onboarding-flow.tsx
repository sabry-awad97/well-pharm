import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Progress } from '@/components/ui/progress';
import { WelcomeScreen } from './screens/welcome-screen';
import { DatabaseConfigScreen } from './screens/database-config-screen';
import { UserCreationScreen } from './screens/user-creation-screen';
import { WorkspaceSetupScreen } from './screens/workspace-setup-screen';
import { SuccessScreen } from './screens/success-screen';
import { invoke } from '@tauri-apps/api/core';

// Define the steps in the onboarding process
const STEPS = [
  'Welcome',
  'Database Configuration',
  'Admin Account',
  'Workspace Setup',
  'Complete',
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Database config
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: 'wellpharm',
    dbUser: 'postgres',
    dbPassword: '',

    // Admin user
    adminName: '',
    adminEmail: '',
    adminPassword: '',

    // Workspace
    pharmacyName: '',
    pharmacyAddress: '',
    pharmacyPhone: '',
    pharmacyEmail: '',
    pharmacyLicense: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if onboarding has been completed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const isOnboarded = await invoke('check_onboarding_status');
        if (isOnboarded) {
          navigate({ to: '/' });
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Configure database
      await invoke('configure_database', {
        host: formData.dbHost,
        port: parseInt(formData.dbPort),
        name: formData.dbName,
        user: formData.dbUser,
        password: formData.dbPassword,
      });

      // Step 2: Create admin user
      await invoke('create_admin_user', {
        name: formData.adminName,
        email: formData.adminEmail,
        password: formData.adminPassword,
      });

      // Step 3: Setup workspace
      await invoke('setup_workspace', {
        name: formData.pharmacyName,
        address: formData.pharmacyAddress,
        phone: formData.pharmacyPhone,
        email: formData.pharmacyEmail,
        license: formData.pharmacyLicense,
      });

      // Step 4: Mark onboarding as complete
      await invoke('complete_onboarding');

      // Move to success screen
      nextStep();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(
        typeof err === 'string'
          ? err
          : 'An error occurred during setup. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const finishOnboarding = () => {
    navigate({ to: '/' });
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
            isLoading={isLoading}
            error={error}
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
                    ? 'text-primary font-bold'
                    : index < currentStep
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/50'
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
