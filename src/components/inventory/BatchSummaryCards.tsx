import { motion } from 'framer-motion';
import { AlertTriangle, Package, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BatchSummaryCardsProps {
  totalBatches: number;
  expiringSoonCount: number;
  lowStockCount: number;
  productsCount: number;
}

export function BatchSummaryCards({
  totalBatches,
  expiringSoonCount,
  lowStockCount,
  productsCount,
}: BatchSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden border-t-4 border-t-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="mr-2 h-4 w-4 text-blue-500" />
              <div className="text-2xl font-bold">{totalBatches}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Across {productsCount} products
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="overflow-hidden border-t-4 border-t-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
              <div className="text-2xl font-bold">{expiringSoonCount}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Within the next 30 days
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="overflow-hidden border-t-4 border-t-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
              <div className="text-2xl font-bold">{lowStockCount}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Batches with less than 10 units
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}