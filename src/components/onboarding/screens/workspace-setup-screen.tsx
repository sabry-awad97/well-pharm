import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface WorkspaceSetupScreenProps {
  formData: {
    pharmacyName: string;
    pharmacyAddress: string;
    pharmacyPhone: string;
    pharmacyEmail: string;
    pharmacyLicense: string;
  };
  onChange: (field: string, value: string) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function WorkspaceSetupScreen({
  formData,
  onChange,
  onSubmit,
  onBack,
  isLoading,
  error,
}: WorkspaceSetupScreenProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">Workspace Setup</h2>
        <p className="text-muted-foreground">
          Enter your pharmacy details to complete the setup process.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="bg-muted/50 p-4">
          <div className="space-y-2">
            <Label htmlFor="pharmacyName">Pharmacy Name</Label>
            <Input
              id="pharmacyName"
              value={formData.pharmacyName}
              onChange={e => onChange('pharmacyName', e.target.value)}
              placeholder="WellPharm Pharmacy"
              required
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="pharmacyAddress">Address</Label>
            <Input
              id="pharmacyAddress"
              value={formData.pharmacyAddress}
              onChange={e => onChange('pharmacyAddress', e.target.value)}
              placeholder="123 Health Street, Medical District"
              required
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pharmacyPhone">Phone Number</Label>
              <Input
                id="pharmacyPhone"
                value={formData.pharmacyPhone}
                onChange={e => onChange('pharmacyPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacyEmail">Email Address</Label>
              <Input
                id="pharmacyEmail"
                type="email"
                value={formData.pharmacyEmail}
                onChange={e => onChange('pharmacyEmail', e.target.value)}
                placeholder="contact@wellpharm.com"
                required
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="pharmacyLicense">Pharmacy License Number</Label>
            <Input
              id="pharmacyLicense"
              value={formData.pharmacyLicense}
              onChange={e => onChange('pharmacyLicense', e.target.value)}
              placeholder="PHR-12345-XYZ"
              required
            />
          </div>
        </Card>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </div>
      </form>
    </div>
  );
}
