import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, HelpCircle, Server } from 'lucide-react';

interface DatabaseConfigScreenProps {
  formData: {
    dbHost: string;
    dbPort: string;
    dbName: string;
    dbUser: string;
    dbPassword: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DatabaseConfigScreen({
  formData,
  onChange,
  onNext,
  onBack,
}: DatabaseConfigScreenProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            Database Configuration
          </h2>
          <p className="text-muted-foreground text-sm">
            Connect to your PostgreSQL database
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <Card className="border-muted bg-card overflow-hidden shadow-sm">
              <div className="border-border/40 bg-muted/30 border-b p-3">
                <div className="flex items-center gap-2">
                  <Server className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-medium">Connection Settings</h3>
                </div>
              </div>
              <div className="space-y-3 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="dbHost" className="text-xs font-medium">
                        Host
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="text-muted-foreground h-3 w-3 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-xs text-xs"
                          >
                            <p>
                              The hostname or IP address of your PostgreSQL
                              server. Use "localhost" if the database is on the
                              same machine.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="dbHost"
                      value={formData.dbHost}
                      onChange={e => onChange('dbHost', e.target.value)}
                      placeholder="localhost"
                      className="h-8 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="dbPort" className="text-xs font-medium">
                        Port
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="text-muted-foreground h-3 w-3 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            <p>The default PostgreSQL port is 5432.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="dbPort"
                      value={formData.dbPort}
                      onChange={e => onChange('dbPort', e.target.value)}
                      placeholder="5432"
                      type="number"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dbName" className="text-xs font-medium">
                    Database Name
                  </Label>
                  <Input
                    id="dbName"
                    value={formData.dbName}
                    onChange={e => onChange('dbName', e.target.value)}
                    placeholder="wellpharm"
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dbUser" className="text-xs font-medium">
                    Username
                  </Label>
                  <Input
                    id="dbUser"
                    value={formData.dbUser}
                    onChange={e => onChange('dbUser', e.target.value)}
                    placeholder="postgres"
                    className="h-8 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dbPassword" className="text-xs font-medium">
                    Password
                  </Label>
                  <Input
                    id="dbPassword"
                    type="password"
                    value={formData.dbPassword}
                    onChange={e => onChange('dbPassword', e.target.value)}
                    placeholder="Enter database password"
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
