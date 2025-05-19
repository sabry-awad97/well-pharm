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
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Bug, Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

// Form schema for product creation
const createProductFormSchema = CreateProductRequestSchema;

// Form schema for product editing
const updateProductFormSchema = UpdateProductRequestSchema.omit({ id: true });

type ProductFormValues = z.infer<typeof createProductFormSchema>;

interface ProductFormPageProps {
  mode: 'create' | 'edit';
}

export function ProductFormPage({ mode }: ProductFormPageProps) {
  const navigate = useNavigate();
  const params =
    mode === 'edit' ? useParams({ from: '/products/$productId/edit' }) : null;
  const productId = params?.productId;

  // Fetch product data for edit mode
  const { data: product, isLoading: isLoadingProduct } = useProduct(
    mode === 'edit' ? (productId ?? null) : null,
  );

  // Mutations for create/update
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  // Initialize form with default values or existing product data
  const form = useForm({
    resolver: zodResolver(
      mode === 'create' ? createProductFormSchema : updateProductFormSchema,
    ),
    defaultValues: {
      name: mode === 'create' ? '' : (product?.name ?? ''),
      genericName: mode === 'create' ? '' : (product?.genericName ?? ''),
      description: mode === 'create' ? '' : (product?.description ?? ''),
      category: mode === 'create' ? 'OTC' : (product?.category ?? 'OTC'),
      dosageForm: mode === 'create' ? '' : (product?.dosageForm ?? ''),
      strength: mode === 'create' ? '' : (product?.strength ?? ''),
      manufacturer: mode === 'create' ? '' : (product?.manufacturer ?? ''),
      barcode: mode === 'create' ? '' : (product?.barcode ?? ''),
      activeIngredients:
        mode === 'create' ? [] : (product?.activeIngredients ?? []),
    },
    values:
      mode === 'edit' && product
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

  // Sample data for debug mode with realistic pharmaceutical data
  const populateWithSampleData = () => {
    // Common medications with their typical dosage forms and strengths
    const medications = [
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        dosageForms: ['Oral Capsule', 'Oral Suspension', 'Chewable Tablet'],
        strengths: ['250mg', '500mg', '875mg', '125mg/5ml', '250mg/5ml'],
        category: 'Prescription',
      },
      {
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        dosageForms: ['Oral Tablet'],
        strengths: ['5mg', '10mg', '20mg', '40mg'],
        category: 'Prescription',
      },
      {
        name: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        dosageForms: ['Oral Tablet', 'Film-Coated Tablet'],
        strengths: ['10mg', '20mg', '40mg', '80mg'],
        category: 'Prescription',
      },
      {
        name: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        dosageForms: ['Oral Tablet', 'Extended-Release Tablet'],
        strengths: ['500mg', '850mg', '1000mg'],
        category: 'Prescription',
      },
      {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        dosageForms: ['Oral Tablet', 'Oral Suspension', 'Soft Gel'],
        strengths: ['200mg', '400mg', '600mg', '800mg', '100mg/5ml'],
        category: 'OTC',
      },
      {
        name: 'Acetaminophen',
        genericName: 'Acetaminophen',
        dosageForms: ['Oral Tablet', 'Oral Suspension', 'Chewable Tablet'],
        strengths: ['325mg', '500mg', '650mg', '160mg/5ml'],
        category: 'OTC',
      },
      {
        name: 'Loratadine',
        genericName: 'Loratadine',
        dosageForms: ['Oral Tablet', 'Orally Disintegrating Tablet'],
        strengths: ['10mg'],
        category: 'OTC',
      },
      {
        name: 'Vitamin D3',
        genericName: 'Cholecalciferol',
        dosageForms: ['Oral Capsule', 'Oral Tablet', 'Oral Drops'],
        strengths: ['1000IU', '2000IU', '5000IU', '400IU/drop'],
        category: 'Supplement',
      },
      {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        dosageForms: ['Delayed-Release Capsule', 'Delayed-Release Tablet'],
        strengths: ['10mg', '20mg', '40mg'],
        category: 'OTC',
      },
      {
        name: 'Fluticasone',
        genericName: 'Fluticasone Propionate',
        dosageForms: ['Nasal Spray', 'Inhalation Aerosol'],
        strengths: ['50mcg/actuation', '100mcg/actuation', '200mcg/actuation'],
        category: 'Prescription',
      },
      {
        name: 'Blood Glucose Test Strips',
        genericName: null,
        dosageForms: ['Test Strip'],
        strengths: ['50 strips/box', '100 strips/box'],
        category: 'MedicalDevice',
      },
      {
        name: 'Digital Thermometer',
        genericName: null,
        dosageForms: ['Device'],
        strengths: ['1 unit'],
        category: 'MedicalDevice',
      },
    ];

    // Pharmaceutical manufacturers
    const manufacturers = [
      'Pfizer Inc.',
      'Novartis Pharmaceuticals',
      'Merck & Co.',
      'GlaxoSmithKline',
      'Teva Pharmaceuticals',
      'Johnson & Johnson',
      'AstraZeneca',
      'Bristol-Myers Squibb',
      'Eli Lilly and Company',
      'Bayer AG',
      'Sanofi',
      'Roche Holding AG',
    ];

    // Generate realistic descriptions based on medication type
    const generateDescription = (
      medication: {
        name: string;
        genericName?: string | null;
        category: string;
      },
      dosageForm: string,
      strength: string,
    ) => {
      if (medication.category === 'MedicalDevice') {
        return `${medication.name} for home use. Designed for accurate and reliable measurements. Easy to use and maintain. Store in a cool, dry place.`;
      }

      const usageDescriptions = [
        `${medication.name} ${strength} ${dosageForm} is used to treat various conditions. Follow your healthcare provider's instructions for dosage and duration of treatment.`,
        `Each ${dosageForm.toLowerCase()} contains ${strength} of ${medication.genericName || medication.name}. Store at room temperature away from moisture and heat.`,
        `${medication.name} (${medication.genericName || ''}) ${strength} is indicated for the treatment of specific conditions as prescribed by your healthcare provider. Read all medication guides and follow all directions on your prescription label.`,
        `This ${dosageForm.toLowerCase()} contains ${strength} of active ingredient. Take as directed by your healthcare provider. Do not exceed the recommended dose.`,
      ];

      return usageDescriptions[
        Math.floor(Math.random() * usageDescriptions.length)
      ];
    };

    // Generate realistic barcode (GS1 or NDC format)
    const generateBarcode = () => {
      // National Drug Code (NDC) format: XXXXX-XXXX-XX or XXXX-XXXX-XX
      const labelerCode = Math.floor(Math.random() * 90000) + 10000;
      const productCode = Math.floor(Math.random() * 9000) + 1000;
      const packageCode = Math.floor(Math.random() * 90) + 10;

      return `${labelerCode}-${productCode}-${packageCode}`;
    };

    // Select a random medication
    const medication =
      medications[Math.floor(Math.random() * medications.length)];
    const dosageForm =
      medication.dosageForms[
        Math.floor(Math.random() * medication.dosageForms.length)
      ];
    const strength =
      medication.strengths[
        Math.floor(Math.random() * medication.strengths.length)
      ];
    const manufacturer =
      manufacturers[Math.floor(Math.random() * manufacturers.length)];

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

  // Handle form submission
  const onSubmit = (values: ProductFormValues) => {
    if (mode === 'create') {
      createProduct(values, {
        onSuccess: data => {
          toast.success('Product created successfully');
          navigate({
            to: '/products/$productId',
            params: { productId: data.id },
          });
        },
        onError: error => {
          toast.error('Failed to create product', {
            description: String(error),
          });
        },
      });
    } else if (mode === 'edit' && productId) {
      updateProduct(
        { id: productId, ...values },
        {
          onSuccess: () => {
            toast.success('Product updated successfully');
            navigate({ to: '/products/$productId', params: { productId } });
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

  // Loading state for edit mode
  if (mode === 'edit' && isLoadingProduct) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <span className="ml-2">Loading product data...</span>
      </div>
    );
  }

  // If product not found in edit mode
  if (mode === 'edit' && !product && !isLoadingProduct) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-muted rounded-md p-4">
          <p>Product not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate({ to: '/products' })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/products' })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'create' ? 'Create New Product' : 'Edit Product'}
          </h1>
        </div>

        {/* Debug panel for form data */}
        {import.meta.env.DEV && (
          <DebugPanel
            data={form.getValues()}
            componentName="ProductForm"
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
                >
                  Populate with sample data
                </Button>
              ),
            }}
          />
        )}
      </div>

      <Form {...form}>
        {/* @ts-expect-error ... */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        <Input placeholder="Enter product name" {...field} />
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
                          value={field.value ?? ''}
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
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Prescription">
                            Prescription
                          </SelectItem>
                          <SelectItem value="OTC">OTC</SelectItem>
                          <SelectItem value="Supplement">Supplement</SelectItem>
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dosageForm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosage Form*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Tablet, Capsule"
                            {...field}
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
                            placeholder="e.g., 500mg, 10mg/ml"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <h2 className="font-semibold">Additional Details</h2>

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
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Manufacturer Information */}
            <div className="space-y-6">
              <div className="space-y-4 rounded-md border p-4">
                <h2 className="font-semibold">Manufacturer Information</h2>

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
                          placeholder="Enter barcode"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <h2 className="font-semibold">Active Ingredients</h2>
                <p className="text-muted-foreground text-sm">
                  Active ingredients functionality will be implemented in a
                  future update.
                </p>
                {/* This would be implemented with a dynamic form array in the future */}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/products' })}
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
                  {mode === 'create' ? 'Create Product' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
