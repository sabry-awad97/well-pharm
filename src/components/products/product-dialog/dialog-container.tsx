import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Save } from 'lucide-react';
import type { ReactNode } from 'react';

interface DialogContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isLoading: boolean;
  isSubmitting: boolean;
  isReadOnly: boolean;
  onSubmit: () => void;
  mode: 'create' | 'edit' | 'view';
  children: ReactNode;
  debugPanel?: ReactNode;
}

export function DialogContainer({
  open,
  onOpenChange,
  title,
  description,
  isLoading,
  isSubmitting,
  isReadOnly,
  onSubmit,
  mode,
  children,
  debugPanel,
}: DialogContainerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden p-0 sm:p-0 md:max-w-4xl lg:max-w-5xl"
        aria-describedby="product-dialog-description"
      >
        {/* Loading state */}
        {isLoading ? (
          <div
            className="flex items-center justify-center py-12"
            aria-live="polite"
          >
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <span className="ml-2">Loading product data...</span>
          </div>
        ) : (
          <>
            {/* Fixed Header */}
            <div className="border-b p-4 sm:p-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{title}</DialogTitle>
                  {debugPanel}
                </div>
                <DialogDescription id="product-dialog-description">
                  {description}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>

            {/* Fixed Footer */}
            <div className="border-t p-4 sm:p-6">
              <DialogFooter>
                {mode !== 'view' ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                      aria-label="Cancel and close dialog"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={onSubmit}
                      disabled={isSubmitting}
                      aria-label={
                        mode === 'create' ? 'Create product' : 'Save changes'
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {mode === 'create' ? 'Creating...' : 'Updating...'}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {mode === 'create'
                            ? 'Create Product'
                            : 'Save Changes'}
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    aria-label="Close dialog"
                  >
                    Close
                  </Button>
                )}
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
