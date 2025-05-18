import {
  type OnboardingProcess,
  useRunOnboardingProcess,
} from '@/api/onboarding';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Waves } from './decorative/waves';
import { DatabaseConfigScreen } from './screens/database-config-screen';
import { SuccessScreen } from './screens/success-screen';
import { UserCreationScreen } from './screens/user-creation-screen';
import { WelcomeScreen } from './screens/welcome-screen';
import { WorkspaceSetupScreen } from './screens/workspace-setup-screen';

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
  const [direction, setDirection] = useState(0); // For animation direction
  const navigate = useNavigate();

  // React Query mutations
  const runOnboardingMutation = useRunOnboardingProcess();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
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
      onError: error => {
        console.error('Onboarding error:', error);
      },
    });
  };

  const finishOnboarding = () => {
    navigate({ to: '/' });
  };

  // Calculate progress percentage
  const progressPercentage = (currentStep / (STEPS.length - 1)) * 100;

  // Animation variants for page transitions
  const pageVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : direction > 0 ? '-100%' : 0,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

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

  // Update the main container in the return statement
  return (
    <div className="from-background to-background/80 relative flex h-screen flex-col overflow-hidden bg-gradient-to-b">
      {/* Decorative background elements */}
      <div className="absolute inset-0 z-0 opacity-10">
        <Waves />
      </div>

      <header className="bg-background/80 relative z-10 border-b p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center">
          <div className="bg-primary mr-4 h-8 w-8 rounded-full" />
          <h1 className="text-2xl font-bold tracking-tight">WellPharm Setup</h1>
        </div>
      </header>

      <main className="relative z-10 container mx-auto flex max-w-3xl flex-1 flex-col px-6 py-6">
        <div className="mb-6">
          <div className="mb-2 flex justify-between">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={cn(
                  'flex flex-col items-center text-sm transition-colors duration-200',
                  {
                    'text-primary font-medium': index === currentStep,
                    'text-muted-foreground': index < currentStep,
                    'text-muted-foreground/40': index > currentStep,
                  },
                )}
              >
                <div
                  className={cn(
                    'mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-200',
                    {
                      'border-primary bg-primary text-primary-foreground':
                        index === currentStep,
                      'border-muted-foreground bg-muted text-foreground':
                        index < currentStep,
                      'border-muted-foreground/40 bg-muted/40 text-muted-foreground/40':
                        index > currentStep,
                    },
                  )}
                >
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {step}
              </div>
            ))}
          </div>
          <Progress
            value={progressPercentage}
            className="bg-muted h-2"
            indicatorClassName="bg-primary transition-all duration-500 ease-in-out"
          />
        </div>

        <div className="bg-card relative flex flex-1 overflow-hidden rounded-xl border p-1 shadow-lg">
          <div className="from-primary/5 via-secondary/5 to-primary/5 absolute inset-0 bg-gradient-to-r opacity-50" />
          <div className="bg-card relative flex flex-1 rounded-lg p-6">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentStep}
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex h-full w-full flex-1"
              >
                <ScrollArea className="h-full w-full">
                  {renderStep()}
                </ScrollArea>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="bg-background/80 text-muted-foreground relative z-10 border-t p-3 text-center text-sm backdrop-blur-sm">
        <p>
          WellPharm Pharmacy Management System &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
