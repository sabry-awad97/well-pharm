import { type BatchItem, useAddBatch, useUpdateBatch } from '@/api/batch';
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
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Combined schema for both add and update
const BatchFormSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantity: z.coerce
    .number()
    .int()
    .nonnegative('Quantity must be non-negative'),
  manufacturingDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  purchasePrice: z.coerce
    .number()
    .nonnegative('Purchase price must be non-negative'),
  notes: z.string().nullable().optional(),
});

type BatchFormValues = z.infer<typeof BatchFormSchema>;

interface BatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  batch: BatchItem | null;
  onSuccess?: () => void;
}

export function BatchForm({
  open,
  onOpenChange,
  productId,
  batch,
  onSuccess,
}: BatchFormProps) {
  const isEditing = !!batch;
  const addBatchMutation = useAddBatch();
  const updateBatchMutation = useUpdateBatch();

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(BatchFormSchema),
    defaultValues: {
      productId,
      batchNumber: batch?.batchNumber || '',
      quantity: batch?.quantity || 0,
      manufacturingDate: batch?.manufacturingDate || '',
      expiryDate: batch?.expiryDate || '',
      purchasePrice: batch?.purchasePrice || 0,
      notes: batch?.notes || '',
    },
  });

  const onSubmit = async (values: BatchFormValues) => {
    try {
      if (isEditing && batch) {
        // Update existing batch
        await updateBatchMutation.mutateAsync({
          id: batch.id,
          quantity: values.quantity,
          manufacturingDate: values.manufacturingDate || null,
          expiryDate: values.expiryDate || null,
          purchasePrice: values.purchasePrice,
          notes: values.notes || null,
        });
      } else {
        // Add new batch
        await addBatchMutation.mutateAsync({
          productId: values.productId,
          batchNumber: values.batchNumber,
          quantity: values.quantity,
          manufacturingDate: values.manufacturingDate || null,
          expiryDate: values.expiryDate || null,
          purchasePrice: values.purchasePrice,
          notes: values.notes || null,
        });
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();
      form.reset();
    } catch (error) {
      console.error('Error submitting batch form:', error);
    }
  };

  const isLoading = addBatchMutation.isPending || updateBatchMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Batch' : 'Add New Batch'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the batch information below.'
              : 'Enter the details for the new batch.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter batch number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      placeholder="Enter quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturing Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter purchase price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter any additional notes"
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Update Batch' : 'Create Batch'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
