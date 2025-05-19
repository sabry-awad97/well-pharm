import { createFileRoute } from '@tanstack/react-router';
import { ProductFormPage } from '@/components/products/product-form-page';

export const Route = createFileRoute('/products/$productId/edit')({
  component: () => <ProductFormPage mode="edit" />,
});
