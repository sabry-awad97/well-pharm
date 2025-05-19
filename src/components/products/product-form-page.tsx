import {
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
  useCreateProduct,
  useProduct,
  useUpdateProduct,
} from '@/api/product';
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
import { ArrowLeft, Loader2, Save } from 'lucide-react';
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
