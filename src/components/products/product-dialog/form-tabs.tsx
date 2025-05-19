import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Package,
  Pill,
} from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormValues } from '.';
import { AdditionalInfoTab } from './tabs/additional-info-tab';
import { BasicInfoTab } from './tabs/basic-info-tab';
import { ProductDetailsTab } from './tabs/product-details-tab';

interface FormTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  form: UseFormReturn<Partial<ProductFormValues>>;
  isReadOnly: boolean;
  mode: 'create' | 'edit' | 'view';
}

export function FormTabs({
  activeTab,
  setActiveTab,
  form,
  isReadOnly,
  mode,
}: FormTabsProps) {
  // Define tab steps for the progress indicator
  const tabSteps = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'details', label: 'Product Details', icon: Pill },
    { id: 'additional', label: 'Additional Info', icon: FileText },
  ];

  // Get current step index
  const currentStepIndex = tabSteps.findIndex(step => step.id === activeTab);

  return (
    <div className="space-y-4">
      {/* Progress indicator (only for create/edit modes) */}
      {mode !== 'view' && (
        <div className="mb-6">
          <div className="relative flex justify-between">
            {tabSteps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div
                  key={step.id}
                  className="z-10 flex cursor-pointer flex-col items-center"
                  onClick={() => setActiveTab(step.id)}
                  onKeyDown={e => e.key === 'Enter' && setActiveTab(step.id)}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30 bg-background text-muted-foreground'
                    } transition-colors`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-1 text-xs font-medium ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}

            {/* Progress line */}
            <div
              className="bg-muted-foreground/30 absolute top-4 right-0 left-0 h-[2px] -translate-y-1/2"
              style={{ zIndex: 0 }}
            >
              <div
                className="bg-primary h-full transition-all"
                style={{
                  width: `${
                    currentStepIndex === 0
                      ? '0%'
                      : currentStepIndex === 1
                        ? '50%'
                        : '100%'
                  }`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        defaultValue="basic"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsContent value="basic" className="space-y-4 pt-2">
          <BasicInfoTab form={form} isReadOnly={isReadOnly} />

          {/* Navigation buttons */}
          {mode !== 'view' && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setActiveTab('details')}
                className="mt-2"
              >
                Next: Product Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4 pt-2">
          <ProductDetailsTab form={form} isReadOnly={isReadOnly} />

          {/* Navigation buttons */}
          {mode !== 'view' && (
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('basic')}
                className="mt-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setActiveTab('additional')}
                className="mt-2"
              >
                Next: Additional Info
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="additional" className="space-y-4 pt-2">
          <AdditionalInfoTab form={form} isReadOnly={isReadOnly} />

          {/* Navigation buttons */}
          {mode !== 'view' && (
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('details')}
                className="mt-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
