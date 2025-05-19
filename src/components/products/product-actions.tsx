import { useState } from 'react';
import { useDeleteProduct } from '@/api/product';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductActionsProps {
  productId: string;
  onView: () => void;
  onEdit: () => void;
}

export function ProductActions({
  productId,
  onView,
  onEdit,
}: ProductActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { mutate: deleteProduct, isPending } = useDeleteProduct();

  const handleDelete = () => {
    deleteProduct(productId, {
      onSuccess: () => {
        toast.success('Product deleted successfully');
        setIsDeleteDialogOpen(false);
      },
      onError: error => {
        toast.error('Failed to delete product', {
          description: String(error),
        });
      },
    });
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onView}
          title="View product details"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          title="Edit product"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDeleteDialogOpen(true)}
          title="Delete product"
        >
          <Trash2 className="text-destructive h-4 w-4" />
        </Button>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
