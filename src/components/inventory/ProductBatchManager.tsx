import type { BatchItem } from '@/api/batch';
import { useState } from 'react';
import { BatchForm } from './BatchForm';
import { BatchList } from './BatchList';
import { BatchTransactionForm } from './BatchTransactionForm';
import { ExpiringBatchesAlert } from './ExpiringBatchesAlert';

interface ProductBatchManagerProps {
  productId: string;
}

export function ProductBatchManager({ productId }: ProductBatchManagerProps) {
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);

  const handleAddBatch = () => {
    setSelectedBatch(null);
    setIsBatchFormOpen(true);
  };

  const handleEditBatch = (batch: BatchItem) => {
    setSelectedBatch(batch);
    setIsBatchFormOpen(true);
  };

  const handleRecordTransaction = (batch: BatchItem) => {
    setSelectedBatch(batch);
    setIsTransactionFormOpen(true);
  };

  const handleFormSuccess = () => {
    // Reset state after successful form submission
    setSelectedBatch(null);
  };

  return (
    <div className="space-y-4">
      <ExpiringBatchesAlert days={30} />

      <BatchList
        productId={productId}
        onAddBatch={handleAddBatch}
        onEditBatch={handleEditBatch}
        onRecordTransaction={handleRecordTransaction}
      />

      <BatchForm
        open={isBatchFormOpen}
        onOpenChange={setIsBatchFormOpen}
        productId={productId}
        batch={selectedBatch}
        onSuccess={handleFormSuccess}
      />

      <BatchTransactionForm
        open={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        batch={selectedBatch}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
