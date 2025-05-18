import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoCircledIcon } from '@radix-ui/react-icons';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-bold">Database Configuration</h2>
        <p className="text-muted-foreground">
          Configure the connection to your PostgreSQL database. This information
          will be stored securely.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="bg-muted/50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="dbHost">Host</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80">
                        The hostname or IP address of your PostgreSQL server.
                        Use "localhost" if the database is on the same machine.
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
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="dbPort">Port</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon className="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
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
                required
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="dbName">Database Name</Label>
            <Input
              id="dbName"
              value={formData.dbName}
              onChange={e => onChange('dbName', e.target.value)}
              placeholder="wellpharm"
              required
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="dbUser">Username</Label>
            <Input
              id="dbUser"
              value={formData.dbUser}
              onChange={e => onChange('dbUser', e.target.value)}
              placeholder="postgres"
              required
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="dbPassword">Password</Label>
            <Input
              id="dbPassword"
              type="password"
              value={formData.dbPassword}
              onChange={e => onChange('dbPassword', e.target.value)}
              placeholder="Enter database password"
              required
            />
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
