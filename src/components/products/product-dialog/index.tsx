import {
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
  useCreateProduct,
  useGetProduct,
  useUpdateProduct,
} from '@/api/product';
import { DebugPanel } from '@/components/debug/debug-panel';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bug } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { ConfirmCloseDialog } from './confirm-close-dialog';
import { DialogContainer } from './dialog-container';
import { FormErrorSummary } from './form-error-summary';
import { FormTabs } from './form-tabs';

// Form schemas
const createProductFormSchema = CreateProductRequestSchema;
const updateProductFormSchema = UpdateProductRequestSchema.omit({ id: true });

export type ProductFormValues = z.infer<typeof createProductFormSchema>;

interface ProductDialogProps {
  mode: 'create' | 'edit' | 'view';
  productId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (productId: string) => void;
}

export function ProductDialog({
  mode,
  productId,
  open,
  onOpenChange,
  onSuccess,
}: ProductDialogProps) {
  // State management
  const [activeTab, setActiveTab] = useState('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Data fetching and mutations
  const { data: product, isLoading: isLoadingProduct } = useGetProduct(
    mode !== 'create' ? (productId ?? null) : null,
  );
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isSubmitting = isCreating || isUpdating;
  const isReadOnly = mode === 'view';

  // Form initialization
  const form = useForm<Partial<ProductFormValues>>({
    resolver: zodResolver(
      mode === 'create' ? createProductFormSchema : updateProductFormSchema,
    ),
    defaultValues: {
      name: '',
      genericName: '',
      description: '',
      category: 'OTC',
      dosageForm: '',
      strength: '',
      manufacturer: '',
      barcode: '',
      activeIngredients: [],
      image: '',
    },
    values:
      mode !== 'create' && product
        ? {
            name: product.name,
            genericName: product.genericName || '',
            description: product.description || '',
            category: product.category,
            dosageForm: product.dosageForm,
            strength: product.strength,
            manufacturer: product.manufacturer,
            barcode: product.barcode || '',
            activeIngredients: product.activeIngredients || [],
            image: product.image || '',
          }
        : undefined,
  });

  // Reset form when product data changes
  useEffect(() => {
    if (mode !== 'create' && product) {
      form.reset({
        name: product.name,
        genericName: product.genericName || '',
        description: product.description || '',
        category: product.category,
        dosageForm: product.dosageForm,
        strength: product.strength,
        manufacturer: product.manufacturer,
        barcode: product.barcode || '',
        activeIngredients: product.activeIngredients || [],
        image: product.image || '',
      });
    }
  }, [product, form, mode]);

  // Track form changes
  useEffect(() => {
    if (mode !== 'view') {
      const subscription = form.watch(() => {
        setHasUnsavedChanges(true);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, mode]);

  // Handle dialog close with confirmation
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (hasUnsavedChanges && mode !== 'view') {
        // Show confirmation dialog if there are unsaved changes
        setShowConfirmClose(true);
      } else {
        // No unsaved changes, close directly and reset form
        resetFormState();
        onOpenChange(false);
      }
    } else {
      onOpenChange(true);
    }
  };

  // Reset form to initial state based on mode
  const resetFormState = () => {
    if (mode === 'create') {
      // Reset to default empty values for create mode
      form.reset({
        name: '',
        genericName: '',
        description: '',
        category: 'OTC',
        dosageForm: '',
        strength: '',
        manufacturer: '',
        barcode: '',
        activeIngredients: [],
        image: '',
      });
    } else if (mode === 'edit' && product) {
      // Reset to original product values for edit mode
      form.reset({
        name: product.name,
        genericName: product.genericName || '',
        description: product.description || '',
        category: product.category,
        dosageForm: product.dosageForm,
        strength: product.strength,
        manufacturer: product.manufacturer,
        barcode: product.barcode || '',
        activeIngredients: product.activeIngredients || [],
        image: product.image || '',
      });
    }

    // Reset active tab to first tab
    setActiveTab('basic');

    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
  };

  // Handle form submission
  const onSubmit = (values: Partial<ProductFormValues>) => {
    if (mode === 'create') {
      createProduct(values as ProductFormValues, {
        onSuccess: data => {
          toast.success('Product created successfully');
          setHasUnsavedChanges(false);
          onOpenChange(false);
          if (onSuccess) onSuccess(data.id);
        },
        onError: error => {
          toast.error('Failed to create product', {
            description: String(error),
          });
        },
      });
    } else if (mode === 'edit' && productId) {
      const updateData = updateProductFormSchema.parse(values);
      updateProduct(
        { id: productId, ...updateData },
        {
          onSuccess: data => {
            toast.success('Product updated successfully');
            setHasUnsavedChanges(false);
            onOpenChange(false);
            if (onSuccess) onSuccess(data.id);
          },
          onError: error => {
            toast.error('Failed to update product', {
              description: String(error),
            });
          },
        },
      );
    }
  };

  // Generate sample data for development
  const populateWithSampleData = () => {
    // Sample data generation logic
    const medications = [
      {
        name: 'Acetaminophen',
        genericName: 'Acetaminophen',
        category: 'OTC',
      },
      {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        category: 'OTC',
      },
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        category: 'Prescription',
      },
      {
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        category: 'Prescription',
      },
      {
        name: 'Vitamin D3',
        genericName: 'Cholecalciferol',
        category: 'Supplement',
      },
    ];

    const dosageForms = [
      'Tablet',
      'Capsule',
      'Liquid',
      'Injection',
      'Cream',
      'Ointment',
      'Patch',
    ];

    // Generate random data (simplified for brevity)
    const medication =
      medications[Math.floor(Math.random() * medications.length)];
    const dosageForm = dosageForms[Math.floor(Math.random() * 3)];
    const strength = ['500 mg', '250 mg', '100 mg'][
      Math.floor(Math.random() * 3)
    ];
    const manufacturer = ['Pfizer', 'Johnson & Johnson', 'Merck'][
      Math.floor(Math.random() * 3)
    ];
    const barcode = Math.floor(Math.random() * 10000000000000)
      .toString()
      .padStart(13, '0');

    const sampleData = {
      name: `${medication.name} ${strength}`,
      genericName: medication.genericName || '',
      description: `${medication.name} ${strength} ${dosageForm.toLowerCase()} for relief of symptoms.`,
      category: medication.category,
      dosageForm: dosageForm,
      strength: strength,
      manufacturer: manufacturer,
      barcode: barcode,
      activeIngredients: medication.genericName ? [medication.genericName] : [],
      image: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Product',
    };

    form.reset(sampleData);
    setHasUnsavedChanges(true);
    toast.success('Form populated with realistic pharmaceutical data');
  };

  // Dialog title and description based on mode
  const dialogTitle =
    mode === 'create'
      ? 'Create New Product'
      : mode === 'edit'
        ? 'Edit Product'
        : 'Product Details';

  const dialogDescription =
    mode === 'create'
      ? 'Add a new product to your inventory'
      : mode === 'edit'
        ? 'Modify product information'
        : 'View product details';

  return (
    <>
      <DialogContainer
        open={open}
        onOpenChange={handleOpenChange}
        title={dialogTitle}
        description={dialogDescription}
        isLoading={mode !== 'create' && isLoadingProduct}
        isSubmitting={isSubmitting}
        isReadOnly={isReadOnly}
        onSubmit={form.handleSubmit(onSubmit)}
        mode={mode}
        debugPanel={
          import.meta.env.DEV && (
            <DebugPanel
              data={form.getValues()}
              componentName="ProductDialog"
              position="inline"
              buttonClassName="h-8 w-8 border-dashed border-muted-foreground/40 bg-muted/50"
              icon={<Bug className="text-muted-foreground h-4 w-4" />}
              additionalInfo={{
                Mode: mode,
                Action: (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={populateWithSampleData}
                    className="h-6 text-xs"
                    disabled={isReadOnly}
                  >
                    Populate with sample data
                  </Button>
                ),
              }}
            />
          )
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Form validation errors summary */}
            <FormErrorSummary errors={form.formState.errors} mode={mode} />

            {/* Tabs for form sections */}
            <FormTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              form={form}
              isReadOnly={isReadOnly}
              mode={mode}
            />

            {/* Accessibility announcement for screen readers */}
            <div aria-live="polite" className="sr-only">
              {form.formState.isValid
                ? 'Form is valid and ready to submit'
                : 'Form has validation errors that need to be corrected'}
            </div>
          </form>
        </Form>
      </DialogContainer>

      {/* Confirmation dialog for unsaved changes */}
      <ConfirmCloseDialog
        open={showConfirmClose}
        onOpenChange={setShowConfirmClose}
        onConfirm={() => {
          resetFormState();
          onOpenChange(false);
        }}
      />
    </>
  );
}
