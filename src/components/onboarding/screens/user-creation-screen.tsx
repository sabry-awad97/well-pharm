import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

interface UserCreationScreenProps {
  formData: {
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function UserCreationScreen({
  formData,
  onChange,
  onNext,
  onBack,
}: UserCreationScreenProps) {
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.adminPassword !== passwordConfirm) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (formData.adminPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">
          Create Administrator Account
        </h2>
        <p className="text-muted-foreground">
          Create the primary administrator account for your pharmacy management
          system.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="bg-muted/50 p-4">
          <div className="space-y-2">
            <Label htmlFor="adminName">Full Name</Label>
            <Input
              id="adminName"
              value={formData.adminName}
              onChange={e => onChange('adminName', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="adminEmail">Email Address</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={e => onChange('adminEmail', e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="adminPassword">Password</Label>
            <Input
              id="adminPassword"
              type="password"
              value={formData.adminPassword}
              onChange={e => {
                onChange('adminPassword', e.target.value);
                setPasswordError('');
              }}
              placeholder="Create a secure password"
              required
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordConfirm}
              onChange={e => {
                setPasswordConfirm(e.target.value);
                setPasswordError('');
              }}
              placeholder="Confirm your password"
              required
            />
            {passwordError && (
              <p className="text-destructive mt-1 text-sm">{passwordError}</p>
            )}
          </div>
        </Card>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </div>
  );
}
