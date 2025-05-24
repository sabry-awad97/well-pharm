import { useExpiringBatches } from '@/api/batch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ExpiringBatchesAlertProps {
  days?: number;
  count?: number;
  onViewDetails?: () => void;
}

export function ExpiringBatchesAlert({
  days = 30,
  count,
  onViewDetails,
}: ExpiringBatchesAlertProps) {
  const { data: expiringBatches, isLoading, error } = !count ? useExpiringBatches(days) : { data: null, isLoading: false, error: null };
  const [expanded, setExpanded] = useState(false);
  
  const batchCount = count || expiringBatches?.length || 0;

  if (isLoading) {
    return (
      <Alert className="bg-muted/50 border-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking expiring batches...</AlertTitle>
      </Alert>
    );
  }

  if (error || (!expiringBatches && !count) || batchCount === 0) {
    return null;
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        "border-l-4 border-l-destructive transition-all duration-200",
        expanded ? "bg-destructive/5" : "bg-card"
      )}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-medium">Expiring Inventory Alert</AlertTitle>
      <AlertDescription className="text-sm">
        <div className="mt-1.5">
          <div className="flex items-center justify-between">
            <p>
              <span className="font-medium">{batchCount}</span>{' '}
              {batchCount === 1 ? 'batch' : 'batches'} will expire
              within the next {days} days.
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 -mr-2 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Hide details' : 'Show details'}
            </Button>
          </div>

          <AnimatePresence>
            {expanded && expiringBatches && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ul className="mt-3 space-y-1 text-sm border-t pt-2 border-destructive/20">
                  {expiringBatches.slice(0, 5).map(batch => (
                    <li key={batch.id} className="flex justify-between py-1 px-1 rounded hover:bg-destructive/10">
                      <span className="font-medium">Batch {batch.batchNumber}</span>
                      <span className="text-destructive">Expires: {formatDate(batch.expiryDate)}</span>
                    </li>
                  ))}
                  {expiringBatches.length > 5 && (
                    <li className="text-center text-xs italic pt-1">
                      And {expiringBatches.length - 5} more...
                    </li>
                  )}
                </ul>
                
                {onViewDetails && (
                  <div className="mt-3 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 border-destructive/30 hover:border-destructive text-destructive hover:text-destructive"
                      onClick={onViewDetails}
                    >
                      View all expiring batches
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AlertDescription>
    </Alert>
  );
}

