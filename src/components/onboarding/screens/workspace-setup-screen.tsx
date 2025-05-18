import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import {
  Building2,
  Phone,
  Mail,
  FileCheck,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

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
          <h2 className="text-2xl font-bold tracking-tight">Workspace Setup</h2>
          <p className="text-muted-foreground text-sm">
            Enter your pharmacy details to complete the setup
          </p>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants}>
            <Alert
              variant="destructive"
              className="border-destructive/30 bg-destructive/10 py-2 text-xs"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-muted bg-card overflow-hidden shadow-sm">
              <div className="border-border/40 bg-muted/30 border-b p-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-medium">Pharmacy Information</h3>
                </div>
              </div>
              <div className="space-y-3 p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pharmacyName" className="text-xs font-medium">
                    Pharmacy Name
                  </Label>
                  <Input
                    id="pharmacyName"
                    value={formData.pharmacyName}
                    onChange={e => onChange('pharmacyName', e.target.value)}
                    placeholder="WellPharm Pharmacy"
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="pharmacyAddress"
                    className="text-xs font-medium"
                  >
                    Address
                  </Label>
                  <Input
                    id="pharmacyAddress"
                    value={formData.pharmacyAddress}
                    onChange={e => onChange('pharmacyAddress', e.target.value)}
                    placeholder="123 Health Street, Medical District"
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Phone className="text-muted-foreground h-3.5 w-3.5" />
                      <Label
                        htmlFor="pharmacyPhone"
                        className="text-xs font-medium"
                      >
                        Phone Number
                      </Label>
                    </div>
                    <Input
                      id="pharmacyPhone"
                      value={formData.pharmacyPhone}
                      onChange={e => onChange('pharmacyPhone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="h-8 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Mail className="text-muted-foreground h-3.5 w-3.5" />
                      <Label
                        htmlFor="pharmacyEmail"
                        className="text-xs font-medium"
                      >
                        Email Address
                      </Label>
                    </div>
                    <Input
                      id="pharmacyEmail"
                      type="email"
                      value={formData.pharmacyEmail}
                      onChange={e => onChange('pharmacyEmail', e.target.value)}
                      placeholder="contact@wellpharm.com"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="pharmacyLicense"
                    className="text-xs font-medium"
                  >
                    Pharmacy License Number
                  </Label>
                  <Input
                    id="pharmacyLicense"
                    value={formData.pharmacyLicense}
                    onChange={e => onChange('pharmacyLicense', e.target.value)}
                    placeholder="PHR-12345-XYZ"
                    className="h-8 text-sm"
                    required
                  />
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
              disabled={isLoading}
              size="sm"
              className="gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              size="sm"
              className="gap-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>Complete Setup</>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
