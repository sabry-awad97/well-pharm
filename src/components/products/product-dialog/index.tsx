import {
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
  useCreateProduct,
  useProduct,
  useUpdateProduct,
} from '@/api/product';
import { DebugPanel } from '@/components/debug/debug-panel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Barcode,
  Bug,
  FileText,
  Loader2,
  Package,
  Pill,
  Save,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
  // State for tabs and unsaved changes
  const [activeTab, setActiveTab] = useState('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

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
      image: '',
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
            image: product.image || '',
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
    if (!open && hasUnsavedChanges && mode !== 'view') {
      setShowConfirmClose(true);
    } else {
      onOpenChange(open);
    }
  };

  // Handle form submission
  const onSubmit = (values: ProductFormValues) => {
    if (mode === 'create') {
      createProduct(values, {
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
      // Ensure we're using the correct schema for validation
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
      image: 'https://placehold.co/400x400/e2e8f0/1e293b?text=Product',
    };

    form.reset(sampleData);
    setHasUnsavedChanges(true);
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
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto p-4 sm:p-6 md:max-w-4xl lg:max-w-5xl"
          aria-describedby="product-dialog-description"
        >
          {/* Loading state */}
          {mode !== 'create' && isLoadingProduct ? (
            <div
              className="flex items-center justify-center py-12"
              aria-live="polite"
            >
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
                <DialogDescription id="product-dialog-description">
                  {dialogDescription}
                </DialogDescription>
              </DialogHeader>

              {/* Form validation errors summary */}
              {mode !== 'view' &&
                form.formState.errors &&
                Object.keys(form.formState.errors).length > 0 && (
                  <div
                    className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm"
                    role="alert"
                    aria-live="assertive"
                  >
                    <p className="font-medium">
                      Please correct the following errors:
                    </p>
                    <ul className="mt-2 ml-4 list-disc">
                      {Object.entries(form.formState.errors).map(
                        ([field, error]) => (
                          <li key={field}>
                            {field.charAt(0).toUpperCase() + field.slice(1)}:{' '}
                            {error?.message?.toString()}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              <Form {...form}>
                <form
                  // @ts-expect-error
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Progress indicator for multi-step form */}
                  {mode !== 'view' && (
                    <div className="mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Basic Info</span>
                        <span className="text-sm font-medium">
                          Product Details
                        </span>
                        <span className="text-sm font-medium">
                          Additional Info
                        </span>
                      </div>
                      <div className="relative mt-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-between">
                          <div
                            className={
                              'bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium'
                            }
                          >
                            1
                          </div>
                          <div
                            className={`${activeTab === 'details' || activeTab === 'additional' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium`}
                          >
                            2
                          </div>
                          <div
                            className={`${activeTab === 'additional' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium`}
                          >
                            3
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tabs for form sections */}
                  <Tabs
                    defaultValue="basic"
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                      <TabsTrigger
                        value="basic"
                        className="flex items-center gap-2"
                      >
                        <Package className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          Basic Information
                        </span>
                        <span className="sm:hidden">Basic</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="details"
                        className="flex items-center gap-2"
                      >
                        <Pill className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          Product Details
                        </span>
                        <span className="sm:hidden">Details</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="additional"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          Additional Info
                        </span>
                        <span className="sm:hidden">More</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Basic Information Tab */}
                    <TabsContent value="basic" className="space-y-4 pt-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-md flex items-center gap-2">
                            <Package className="text-primary h-5 w-5" />
                            Basic Information
                          </CardTitle>
                          <CardDescription>
                            Enter the core product details
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Product Name
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter product name"
                                    {...field}
                                    readOnly={isReadOnly}
                                    aria-required="true"
                                    aria-invalid={!!form.formState.errors.name}
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
                                <FormLabel>
                                  Category
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                </FormLabel>
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

                          <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product Image</FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-4">
                                    <div className="bg-muted relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-md">
                                      {field.value ? (
                                        <img
                                          src={field.value}
                                          alt="Product"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <Pill className="text-muted-foreground h-10 w-10" />
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // Mock image upload - in real app, implement file upload
                                          const mockImageUrl =
                                            'https://placehold.co/400x400/e2e8f0/1e293b?text=Product';
                                          field.onChange(mockImageUrl);
                                        }}
                                        disabled={isReadOnly}
                                      >
                                        Upload Image
                                      </Button>
                                      {field.value && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => field.onChange('')}
                                          disabled={isReadOnly}
                                        >
                                          Remove
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      {/* Navigation buttons */}
                      {mode !== 'view' && (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className="mt-2"
                          >
                            Next: Product Details
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    {/* Product Details Tab */}
                    <TabsContent value="details" className="space-y-4 pt-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-md flex items-center gap-2">
                            <Pill className="text-primary h-5 w-5" />
                            Product Details
                          </CardTitle>
                          <CardDescription>
                            Enter specific product information
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="dosageForm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Dosage Form
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Tablet, Capsule, Liquid"
                                    {...field}
                                    readOnly={isReadOnly}
                                    aria-required="true"
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
                                <FormLabel>
                                  Strength
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., 500mg, 50ml"
                                    {...field}
                                    readOnly={isReadOnly}
                                    aria-required="true"
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
                                <FormLabel>
                                  Manufacturer
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter manufacturer name"
                                    {...field}
                                    readOnly={isReadOnly}
                                    aria-required="true"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      {/* Navigation buttons */}
                      {mode !== 'view' && (
                        <div className="flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab('basic')}
                            className="mt-2"
                          >
                            Back
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setActiveTab('additional')}
                            className="mt-2"
                          >
                            Next: Additional Info
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    {/* Additional Info Tab */}
                    <TabsContent value="additional" className="space-y-4 pt-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-md flex items-center gap-2">
                            <FileText className="text-primary h-5 w-5" />
                            Additional Information
                          </CardTitle>
                          <CardDescription>
                            Enter supplementary product details
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Enter product barcode"
                                      {...field}
                                      value={field.value || ''}
                                      readOnly={isReadOnly}
                                      className="flex-1"
                                    />
                                    {!isReadOnly && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                          // Generate a random barcode
                                          const generateBarcode = () => {
                                            return Math.floor(
                                              Math.random() * 10000000000000,
                                            )
                                              .toString()
                                              .padStart(13, '0');
                                          };
                                          field.onChange(generateBarcode());
                                          toast.success(
                                            'Barcode scanned successfully',
                                          );
                                        }}
                                        disabled={isReadOnly}
                                        title="Scan barcode"
                                      >
                                        <Barcode className="h-4 w-4" />
                                        <span className="sr-only">
                                          Scan barcode
                                        </span>
                                      </Button>
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      {/* Navigation buttons */}
                      {mode !== 'view' && (
                        <div className="flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab('details')}
                            className="mt-2"
                          >
                            Back
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Accessibility announcement for screen readers */}
                  <div aria-live="polite" className="sr-only">
                    {form.formState.isValid
                      ? 'Form is valid and ready to submit'
                      : 'Form has validation errors that need to be corrected'}
                  </div>

                  <DialogFooter>
                    {mode !== 'view' ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleOpenChange(false)}
                          disabled={isSubmitting}
                          aria-label="Cancel and close dialog"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          aria-label={
                            mode === 'create'
                              ? 'Create product'
                              : 'Save changes'
                          }
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {mode === 'create'
                                ? 'Creating...'
                                : 'Updating...'}
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
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for unsaved changes */}
      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you close this
              dialog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setHasUnsavedChanges(false);
                onOpenChange(false);
              }}
              className={cn('bg-destructive hover:bg-destructive/90')}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
