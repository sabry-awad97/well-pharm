import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { NavItemType } from '../nav-items';

// Interface for NavItem props with improved typing
interface NavItemProps {
  item: NavItemType;
  isActive: boolean | ((path: string) => boolean); // Can be either a boolean or a function
  isCollapsed: boolean;
  isChild?: boolean;
  isParentExpanded?: boolean;
  onClick?: () => void;
  onToggleSubmenu?: (item: NavItemType) => void;
  expandedParents: Record<string, boolean>;
  tabIndex: number;
}

const navItem = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
};

/**
 * NavItem component - Renders a single navigation item with proper accessibility
 * Now supports child items and submenu functionality
 */
const NavItem = ({
  item,
  isActive,
  isCollapsed,
  isChild = false,
  onClick,
  onToggleSubmenu,
  expandedParents,
  tabIndex,
}: NavItemProps) => {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = hasChildren && expandedParents[item.to];

  // Determine if the item is active - handle both boolean and function types
  const isItemActive =
    typeof isActive === 'function' ? isActive(item.to) : isActive;

  // Handle keyboard navigation
  const handleKeyDown: React.KeyboardEventHandler<
    HTMLAnchorElement | HTMLButtonElement
  > = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasChildren && onToggleSubmenu) {
        onToggleSubmenu(item);
      } else {
        onClick?.();
      }
    }
  };

  // Handle click on parent items with children
  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && onToggleSubmenu) {
      e.preventDefault();
      onToggleSubmenu(item);
    } else {
      onClick?.();
    }
  };

  // Determine if this is a link or a button (for parent items with children)
  const itemContent = (
    <>
      {isItemActive && !isChild && (
        <motion.div
          layoutId="activeIndicator"
          className="bg-primary absolute top-0 bottom-0 left-0 w-1 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <motion.div
        whileHover={!isItemActive ? 'hover' : undefined}
        variants={navItem}
        className={cn(
          'flex h-5 w-5 items-center justify-center transition-transform',
          !isItemActive && 'group-hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </motion.div>
      {!isCollapsed && <span className="truncate text-xs">{item.label}</span>}{' '}
      {/* Reduced from text-sm to text-xs */}
      {item.badge && !isCollapsed && (
        <span className="bg-primary/10 text-primary ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium">
          {' '}
          {/* Reduced size */}
          {item.badge}
        </span>
      )}
      {hasChildren && !isCollapsed && (
        <ChevronDown
          className={cn(
            'ml-auto h-3 w-3 transition-transform duration-200', // Reduced from h-4 w-4 to h-3 w-3
            isExpanded ? 'rotate-180' : '',
          )}
        />
      )}
    </>
  );

  // Render the item with updated styling
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {hasChildren ? (
            <button
              type="button"
              className={cn(
                'group relative flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200', // Reduced padding and font size
                isItemActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCollapsed && 'justify-center px-2',
                isChild && !isCollapsed && 'pl-7', // Reduced from pl-9 to pl-7
                'focus-visible:ring-ring focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none', // Reduced ring size
              )}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              tabIndex={tabIndex}
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-controls={
                hasChildren
                  ? `submenu-${item.to.replace(/\//g, '-')}`
                  : undefined
              }
            >
              {itemContent}
            </button>
          ) : (
            <Link
              to={item.to}
              className={cn(
                'group relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200', // Reduced padding and font size
                isItemActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCollapsed && 'justify-center px-2',
                isChild && !isCollapsed && 'pl-7', // Reduced from pl-9 to pl-7
                'focus-visible:ring-ring focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none', // Reduced ring size
              )}
              onClick={onClick}
              onKeyDown={handleKeyDown}
              tabIndex={tabIndex}
              aria-current={isItemActive ? 'page' : undefined}
            >
              {itemContent}
            </Link>
          )}
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">{item.label}</TooltipContent>
        )}
      </Tooltip>

      {/* Render children if this is a parent item with children */}
      {hasChildren && !isCollapsed && isExpanded && (
        <AnimatePresence>
          <motion.div
            id={`submenu-${item.to.replace(/\//g, '-')}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1">
              {item.children?.map((child, childIndex) => (
                <NavItem
                  key={child.to}
                  item={child}
                  isActive={typeof isActive === 'function' ? isActive : false}
                  isCollapsed={isCollapsed}
                  isChild={true}
                  onClick={onClick}
                  expandedParents={expandedParents}
                  tabIndex={tabIndex + childIndex + 1}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </TooltipProvider>
  );
};

export default NavItem;
