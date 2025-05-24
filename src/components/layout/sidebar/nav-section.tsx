import type { NavItemType } from '../nav-items';
import NavItem from './nav-item';

// Interface for NavSection props
interface NavSectionProps {
  title: string;
  items: NavItemType[];
  isCollapsed: boolean;
  isActive: (path: string) => boolean;
  onClick?: () => void;
  onToggleSubmenu: (item: NavItemType) => void;
  expandedParents: Record<string, boolean>;
  startTabIndex: number;
}

/**
 * NavSection component - Groups related navigation items
 * Now supports nested navigation
 */
const NavSection = ({
  title,
  items,
  isCollapsed,
  isActive,
  onClick,
  onToggleSubmenu,
  expandedParents,
  startTabIndex,
}: NavSectionProps) => {
  return (
    <div className="mb-1.5">
      {' '}
      {/* Reduced from mb-2 */}
      {!isCollapsed && (
        <h3 className="text-muted-foreground mb-1 px-2.5 text-[10px] font-medium tracking-wider uppercase">
          {' '}
          {/* Updated styling */}
          {title}
        </h3>
      )}
      <div className="grid gap-0.5">
        {items.map((item, index) => (
          <NavItem
            key={item.to}
            item={item}
            isActive={isActive(item.to)}
            isCollapsed={isCollapsed}
            onClick={onClick}
            onToggleSubmenu={onToggleSubmenu}
            expandedParents={expandedParents}
            tabIndex={startTabIndex + index}
          />
        ))}
      </div>
    </div>
  );
};

export default NavSection;
