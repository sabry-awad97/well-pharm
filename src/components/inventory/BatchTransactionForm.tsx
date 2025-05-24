import { type BatchItem, useRecordBatchTransaction } from '@/api/batch';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const TransactionFormSchema = z.object({
  transactionType: z.enum(['add', 'remove']),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof TransactionFormSchema>;

interface BatchTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: BatchItem | null;
  onSuccess?: () => void;
}

export function BatchTransactionForm({
  open,
  onOpenChange,
  batch,
  onSuccess,
}: BatchTransactionFormProps) {
  const recordTransactionMutation = useRecordBatchTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(TransactionFormSchema),
    defaultValues: {
      transactionType: 'add',
      quantity: 1,
      notes: '',
    },
  });

  const onSubmit = async (values: TransactionFormValues) => {
    if (!batch) return;

    try {
      // Convert quantity based on transaction type
      const adjustedQuantity =
        values.transactionType === 'add' ? values.quantity : -values.quantity;

      await recordTransactionMutation.mutateAsync({
        batchId: batch.id,
        quantity: adjustedQuantity,
        transactionType: values.transactionType,
        notes: values.notes || null,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
      form.reset();
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  };

  const isLoading = recordTransactionMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Batch Transaction</DialogTitle>
          <DialogDescription>
            {batch
              ? `Update stock for batch ${batch.batchNumber}`
              : 'Select a batch first'}
          </DialogDescription>
        </DialogHeader>

        {batch && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="transactionType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Transaction Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="add" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Add Stock
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="remove" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Remove Stock
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        min="1"
                        placeholder="Enter quantity"
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
                        placeholder="Enter reason for adjustment (optional)"
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Record Transaction
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
