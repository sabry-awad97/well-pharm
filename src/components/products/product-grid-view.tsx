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
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border py-12 text-center">
        <Package className="text-muted-foreground h-12 w-12" />
        <h3 className="mt-4 text-lg font-semibold">No products found</h3>
        <p className="text-muted-foreground mt-2 text-sm">
          Try adjusting your filters or add a new product
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <ProductCategoryBadge category={product.category} />
                <Badge variant="outline">{product.dosageForm}</Badge>
              </div>
              <h3 className="line-clamp-2 font-semibold">{product.name}</h3>
              {product.genericName && (
                <p className="text-muted-foreground line-clamp-1 text-sm">
                  {product.genericName}
                </p>
              )}
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Strength</p>
                  <p>{product.strength}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Manufacturer</p>
                  <p className="truncate">{product.manufacturer}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="flex w-full justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onView(product.id)}
                >
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onEdit(product.id)}
                >
                  <Edit className="mr-1 h-3.5 w-3.5" />
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
