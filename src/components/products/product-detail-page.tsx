import { useProduct } from '@/api/product';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { ProductCategoryBadge } from './product-category-badge';

export function ProductDetailPage() {
  const { productId } = useParams({ from: '/products/$productId' });
  const navigate = useNavigate();

  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <span className="ml-2">Loading product details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          <p>Error loading product: {String(error)}</p>
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

  if (!product) {
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

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/products' })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="text-muted-foreground">
              {product.genericName || 'No generic name'}
            </p>
          </div>
        </div>
        <Button
          onClick={() =>
            navigate({
              to: '/products/$productId/edit',
              params: { productId },
            })
          }
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <h2 className="mb-2 font-semibold">Basic Information</h2>
            <dl className="grid grid-cols-[120px_1fr] gap-2">
              <dt className="text-muted-foreground">Category:</dt>
              <dd>
                <ProductCategoryBadge category={product.category} />
              </dd>

              <dt className="text-muted-foreground">Dosage Form:</dt>
              <dd>{product.dosageForm}</dd>

              <dt className="text-muted-foreground">Strength:</dt>
              <dd>{product.strength}</dd>

              <dt className="text-muted-foreground">Manufacturer:</dt>
              <dd>{product.manufacturer}</dd>

              <dt className="text-muted-foreground">Barcode:</dt>
              <dd>{product.barcode || 'N/A'}</dd>
            </dl>
          </div>

          {product.description && (
            <div className="rounded-md border p-4">
              <h2 className="mb-2 font-semibold">Description</h2>
              <p className="text-sm">{product.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <h2 className="mb-2 font-semibold">Active Ingredients</h2>
            {Array.isArray(product.activeIngredients) &&
            product.activeIngredients.length > 0 ? (
              <ul className="list-inside list-disc space-y-1">
                {product.activeIngredients.map(ingredient => (
                  <li
                    key={
                      typeof ingredient === 'string'
                        ? ingredient
                        : JSON.stringify(ingredient)
                    }
                    className="text-sm"
                  >
                    {typeof ingredient === 'string'
                      ? ingredient
                      : JSON.stringify(ingredient)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No active ingredients listed
              </p>
            )}
          </div>

          <div className="rounded-md border p-4">
            <h2 className="mb-2 font-semibold">Additional Information</h2>
            <dl className="grid grid-cols-[120px_1fr] gap-2">
              <dt className="text-muted-foreground">Created:</dt>
              <dd className="text-sm">
                {new Date(product.createdAt).toLocaleDateString()}
              </dd>

              <dt className="text-muted-foreground">Last Updated:</dt>
              <dd className="text-sm">
                {new Date(product.updatedAt).toLocaleDateString()}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
