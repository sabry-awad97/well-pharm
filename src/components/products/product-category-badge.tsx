import { Badge } from '@/components/ui/badge';

interface ProductCategoryBadgeProps {
  category: string;
}

export function ProductCategoryBadge({ category }: ProductCategoryBadgeProps) {
  // Define color schemes for different categories
  const getVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case 'prescription':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'otc':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'supplement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'medicaldevice':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    if (category === 'OTC') return 'OTC';
    if (category === 'MedicalDevice') return 'Medical Device';

    // Add spaces before capital letters and capitalize first letter
    return category
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  };

  const variant = getVariant(category);
  const displayName = formatCategoryName(category);

  return (
    <Badge variant="outline" className={`${variant} font-medium`}>
      {displayName}
    </Badge>
  );
}
