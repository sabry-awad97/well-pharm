import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const pageHeaderVariants = cva('', {
  variants: {
    size: {
      default: 'mb-6',
      sm: 'mb-4',
      lg: 'mb-8',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface PageHeaderProps
  extends VariantProps<typeof pageHeaderVariants> {
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
}

/**
 * PageHeader component for consistent page headers across the application
 *
 * @param title - The main title of the page
 * @param description - Optional description text
 * @param size - Size variant (affects spacing)
 * @param className - Additional CSS classes
 * @param actions - Optional action buttons/elements to display in the header
 */
export function PageHeader({
  title,
  description,
  size,
  className,
  actions,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between',
        pageHeaderVariants({ size }),
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {actions && (
        <div className="mt-3 flex flex-shrink-0 sm:mt-0">{actions}</div>
      )}
    </div>
  );
}
