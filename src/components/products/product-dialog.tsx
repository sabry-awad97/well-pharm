import {
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
  useCreateProduct,
  useProduct,
  useUpdateProduct,
} from '@/api/product';
import { DebugPanel } from '@/components/debug/debug-panel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bug, Loader2, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

// Form schema for product creation
const createProductFormSchema = CreateProductRequestSchema;

// Form schema for product editing
const updateProductFormSchema = UpdateProductRequestSchema.omit({ id: true });

type ProductFormValues = z.infer<typeof createProductFormSchema>;

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
  // Fetch product data for edit/view mode
  const { data: product, isLoading: isLoadingProduct } = useProduct(
    mode !== 'create' ? (productId ?? null) : null,
  );

  // Mutations for create/update
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isSubmitting = isCreating || isUpdating;
  const isReadOnly = mode === 'view';

  // Initialize form with default values or existing product data
  const form = useForm({
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
    },
    // Only set values when product data is available in edit/view mode
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
          }
        : undefined,
  });

  // Reset form when product data changes in edit/view mode
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
      });
    }
  }, [product, form, mode]);

  // Handle form submission
  const onSubmit = (values: ProductFormValues) => {
    if (mode === 'create') {
      createProduct(values, {
        onSuccess: data => {
          toast.success('Product created successfully');
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
      // Ensure we're using the correct schema for validation
      const updateData = updateProductFormSchema.parse(values);
      updateProduct(
        { id: productId, ...updateData },
        {
          onSuccess: data => {
            toast.success('Product updated successfully');
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
    // Sample data generation logic (same as in ProductFormPage)
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

    const strengths = [
      '500 mg',
      '250 mg',
      '100 mg',
      '50 mg',
      '10 mg',
      '5 mg',
      '2.5 mg',
      '1000 IU',
    ];

    const manufacturers = [
      'Pfizer',
      'Johnson & Johnson',
      'Merck',
      'GlaxoSmithKline',
      'Novartis',
      'Roche',
      'Sanofi',
      'AbbVie',
    ];

    // Generate random data
    const medication =
      medications[Math.floor(Math.random() * medications.length)];
    const dosageForm =
      dosageForms[Math.floor(Math.random() * dosageForms.length)];
    const strength = strengths[Math.floor(Math.random() * strengths.length)];
    const manufacturer =
      manufacturers[Math.floor(Math.random() * manufacturers.length)];

    // Generate a random barcode
    const generateBarcode = () => {
      return Math.floor(Math.random() * 10000000000000)
        .toString()
        .padStart(13, '0');
    };

    // Generate a description
    const generateDescription = (
      med: { name: string },
      form: string,
      str: string,
    ) => {
      return `${med.name} ${str} ${form.toLowerCase()} for relief of symptoms. Store at room temperature away from moisture and heat.`;
    };

    const sampleData = {
      name: `${medication.name} ${strength}`,
      genericName: medication.genericName || '',
      description: generateDescription(medication, dosageForm, strength),
      category: medication.category,
      dosageForm: dosageForm,
      strength: strength,
      manufacturer: manufacturer,
      barcode: generateBarcode(),
      activeIngredients: medication.genericName ? [medication.genericName] : [],
    };

    form.reset(sampleData);
    toast.success('Form populated with realistic pharmaceutical data', {
      description:
        'All fields have been filled with industry-standard test values',
      duration: 3000,
    });
  };

  // Dialog title based on mode
  const dialogTitle =
    mode === 'create'
      ? 'Create New Product'
      : mode === 'edit'
        ? 'Edit Product'
        : 'Product Details';

  // Dialog description based on mode
  const dialogDescription =
    mode === 'create'
      ? 'Add a new product to your inventory'
      : mode === 'edit'
        ? 'Modify product information'
        : 'View product details';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {/* Loading state */}
        {mode !== 'create' && isLoadingProduct ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <span className="ml-2">Loading product data...</span>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{dialogTitle}</DialogTitle>
                {/* Debug panel for form data */}
                {import.meta.env.DEV && (
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
                )}
              </div>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                // @ts-expect-error ...
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div className="space-y-4 rounded-md border p-4">
                      <h2 className="font-semibold">Basic Information</h2>

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter product name"
                                {...field}
                                readOnly={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="genericName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Generic Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter generic name"
                                {...field}
                                value={field.value || ''}
                                readOnly={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category*</FormLabel>
                            <Select
                              disabled={isReadOnly}
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Prescription">
                                  Prescription
                                </SelectItem>
                                <SelectItem value="OTC">
                                  Over-the-counter
                                </SelectItem>
                                <SelectItem value="Supplement">
                                  Supplement
                                </SelectItem>
                                <SelectItem value="MedicalDevice">
                                  Medical Device
                                </SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-6">
                    <div className="space-y-4 rounded-md border p-4">
                      <h2 className="font-semibold">Product Details</h2>

                      <FormField
                        control={form.control}
                        name="dosageForm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosage Form*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Tablet, Capsule, Liquid"
                                {...field}
                                readOnly={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="strength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Strength*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 500mg, 50ml"
                                {...field}
                                readOnly={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="manufacturer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manufacturer*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter manufacturer name"
                                {...field}
                                readOnly={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4 rounded-md border p-4">
                  <h2 className="font-semibold">Additional Information</h2>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter product description"
                            className="min-h-[100px]"
                            {...field}
                            value={field.value || ''}
                            readOnly={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter product barcode"
                            {...field}
                            value={field.value || ''}
                            readOnly={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  {mode !== 'view' ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
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
                    <Button type="button" onClick={() => onOpenChange(false)}>
                      Close
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
