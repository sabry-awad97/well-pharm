import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-md space-y-4">
        <motion.div variants={itemVariants} className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Create Administrator Account
          </h2>
          <p className="text-muted-foreground text-sm">
            Set up the primary admin account for your system
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-muted bg-card overflow-hidden shadow-sm">
              <div className="border-border/40 bg-muted/30 border-b p-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-medium">Admin Credentials</h3>
                </div>
              </div>
              <div className="space-y-3 p-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <User className="text-muted-foreground h-3.5 w-3.5" />
                    <Label htmlFor="adminName" className="text-xs font-medium">
                      Full Name
                    </Label>
                  </div>
                  <Input
                    id="adminName"
                    value={formData.adminName}
                    onChange={e => onChange('adminName', e.target.value)}
                    placeholder="John Doe"
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Mail className="text-muted-foreground h-3.5 w-3.5" />
                    <Label htmlFor="adminEmail" className="text-xs font-medium">
                      Email Address
                    </Label>
                  </div>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={e => onChange('adminEmail', e.target.value)}
                    placeholder="admin@example.com"
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Lock className="text-muted-foreground h-3.5 w-3.5" />
                    <Label
                      htmlFor="adminPassword"
                      className="text-xs font-medium"
                    >
                      Password
                    </Label>
                  </div>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={formData.adminPassword}
                    onChange={e => {
                      onChange('adminPassword', e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Create a secure password"
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Lock className="text-muted-foreground h-3.5 w-3.5" />
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs font-medium"
                    >
                      Confirm Password
                    </Label>
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordConfirm}
                    onChange={e => {
                      setPasswordConfirm(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Confirm your password"
                    className="h-8 text-sm"
                    required
                  />
                  {passwordError && (
                    <p className="text-destructive text-xs font-medium">
                      {passwordError}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex justify-between pt-2"
          >
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              size="sm"
              className="gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button type="submit" size="sm" className="gap-1">
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
