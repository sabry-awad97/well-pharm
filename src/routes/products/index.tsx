import { createFileRoute } from '@tanstack/react-router';
import { ProductListingPage } from '@/components/products/product-listing-page';

export const Route = createFileRoute('/products/')({
  component: ProductListingPage,
});
