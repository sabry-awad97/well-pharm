import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Barcode, FileText } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface AdditionalInfoTabProps {
  form: UseFormReturn<any>;
  isReadOnly: boolean;
}

export function AdditionalInfoTab({
  form,
  isReadOnly,
}: AdditionalInfoTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-md flex items-center gap-2">
          <FileText className="text-primary h-5 w-5" />
          Additional Information
        </CardTitle>
        <CardDescription>Enter supplementary product details</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
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
            <FormItem className="sm:col-span-2">
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
                          return Math.floor(Math.random() * 10000000000000)
                            .toString()
                            .padStart(13, '0');
                        };
                        field.onChange(generateBarcode());
                        toast.success('Barcode scanned successfully');
                      }}
                      disabled={isReadOnly}
                      title="Scan barcode"
                    >
                      <Barcode className="h-4 w-4" />
                      <span className="sr-only">Scan barcode</span>
                    </Button>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Product Image URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter image URL"
                  {...field}
                  value={field.value || ''}
                  readOnly={isReadOnly}
                />
              </FormControl>
              <FormMessage />
              {field.value && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={field.value}
                    alt="Product preview"
                    className="h-32 w-32 rounded-md border object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
                    }}
                  />
                </div>
              )}
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
