import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Pill } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormValues } from '..';

interface ProductDetailsTabProps {
  form: UseFormReturn<Partial<ProductFormValues>>;
  isReadOnly: boolean;
}

export function ProductDetailsTab({
  form,
  isReadOnly,
}: ProductDetailsTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-md flex items-center gap-2">
          <Pill className="text-primary h-5 w-5" />
          Product Details
        </CardTitle>
        <CardDescription>Enter specific product information</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="dosageForm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Dosage Form
                <span className="text-destructive ml-1">*</span>
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
                <span className="text-destructive ml-1">*</span>
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
                <span className="text-destructive ml-1">*</span>
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

        <FormField
          control={form.control}
          name="activeIngredients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Active Ingredients</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter active ingredients"
                  value={field.value?.join(', ') || ''}
                  onChange={e => {
                    const value = e.target.value;
                    field.onChange(
                      value ? value.split(',').map(item => item.trim()) : [],
                    );
                  }}
                  readOnly={isReadOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
