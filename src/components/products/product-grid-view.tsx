import type { Product } from '@/api/product';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Edit, Eye, Package } from 'lucide-react';
import { ProductCategoryBadge } from './product-category-badge';

interface ProductGridViewProps {
  products: Product[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

export function ProductGridView({
  products,
  onView,
  onEdit,
}: ProductGridViewProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border bg-gray-50 py-12 text-center dark:bg-gray-900">
        <Package className="text-muted-foreground h-16 w-16" />
        <h3 className="mt-6 text-xl font-semibold">No Products Found</h3>
        <p className="text-muted-foreground mt-2 text-sm">
          Try adjusting your search or filters, or add a new product.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ y: -5, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
        >
          <Card className="h-full overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-lg">
            <CardHeader className="p-4 pb-2">
              <div className="mb-2 flex items-center justify-between">
                <ProductCategoryBadge category={product.category} />
                <Badge variant="outline" className="text-xs">
                  {product.dosageForm}
                </Badge>
              </div>
              <h3 className="line-clamp-2 h-[3em] text-base leading-tight font-semibold">
                {product.name}
              </h3>
              {product.genericName && (
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {product.genericName}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-1 pb-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-0.5">Strength</p>
                  <p className="font-medium">{product.strength}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-0.5">Manufacturer</p>
                  <p className="truncate font-medium">{product.manufacturer}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 p-3 dark:bg-gray-800/50">
              <div className="flex w-full space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => onView(product.id)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => onEdit(product.id)}
                >
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
