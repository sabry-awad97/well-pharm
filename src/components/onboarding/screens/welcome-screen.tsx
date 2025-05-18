import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-3xl font-bold">Welcome to WellPharm</h2>

      <div className="py-6">
        <img
          src="/logo.png"
          alt="WellPharm Logo"
          className="mx-auto h-32 w-32"
          onError={e => {
            e.currentTarget.src =
              'https://via.placeholder.com/128?text=WellPharm';
          }}
        />
      </div>

      <div className="space-y-4 text-left">
        <p>
          WellPharm is a comprehensive pharmacy management system designed to
          streamline operations, enhance patient care, and ensure regulatory
          compliance.
        </p>

        <p>
          This setup wizard will guide you through the initial configuration of
          your system:
        </p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Configure your database connection</li>
          <li>Create your administrator account</li>
          <li>Set up your pharmacy workspace</li>
        </ul>

        <p>
          Let's get started with setting up your pharmacy management system!
        </p>
      </div>

      <div className="pt-4">
        <Button onClick={onNext} size="lg">
          Get Started
        </Button>
      </div>
    </div>
  );
}
