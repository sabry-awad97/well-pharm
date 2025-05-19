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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormValues } from '..';

interface BasicInfoTabProps {
  form: UseFormReturn<Partial<ProductFormValues>>;
  isReadOnly: boolean;
}

export function BasicInfoTab({ form, isReadOnly }: BasicInfoTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-md flex items-center gap-2">
          <Package className="text-primary h-5 w-5" />
          Basic Information
        </CardTitle>
        <CardDescription>Enter the core product details</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>
                Product Name
                <span className="text-destructive ml-1">*</span>
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
                <span className="text-destructive ml-1">*</span>
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
                  <SelectItem value="OTC">Over-the-counter (OTC)</SelectItem>
                  <SelectItem value="Rx">Prescription (Rx)</SelectItem>
                  <SelectItem value="Supplement">Supplement</SelectItem>
                  <SelectItem value="Medical Device">Medical Device</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
