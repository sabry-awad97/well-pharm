import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface SuccessScreenProps {
  onFinish: () => void;
}

export function SuccessScreen({ onFinish }: SuccessScreenProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <CheckCircle2 className="text-primary h-16 w-16" />
      </div>

      <h2 className="text-3xl font-bold">Setup Complete!</h2>

      <p className="text-lg">
        Your WellPharm pharmacy management system has been successfully
        configured.
      </p>

      <div className="space-y-4 text-left">
        <p>You can now:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Manage inventory and products</li>
          <li>Process prescriptions and sales</li>
          <li>Track patient records</li>
          <li>Generate reports and analytics</li>
          <li>Configure additional users and permissions</li>
        </ul>
      </div>

      <div className="pt-6">
        <Button onClick={onFinish} size="lg">
          Start Using WellPharm
        </Button>
      </div>
    </div>
  );
}
