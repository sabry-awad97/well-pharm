import { useCurrentUser, useLogout } from '@/api/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/use-media-query';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useMatches, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  Menu,
  Pill,
  Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { type NavItemType, navItems } from '../nav-items';

// Animation variants for sidebar elements
const sidebarAnimationVariants = {
  profile: {
    hidden: { opacity: 0, x: -20, transition: { duration: 0.2 } },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 } },
  },
  container: {
    collapsed: { width: 70, transition: { duration: 0.3, ease: 'easeInOut' } },
    expanded: { width: 220, transition: { duration: 0.3, ease: 'easeInOut' } }, // Reduced from 240px to 220px
  },
  footer: {
    collapsed: { justifyContent: 'center', transition: { duration: 0.3 } },
    expanded: {
      justifyContent: 'space-between',
      transition: { duration: 0.3 },
    },
  },
  navItem: {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  },
};

// Interface for NavItem props with improved typing
interface NavItemProps {
  item: NavItemType;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
  tabIndex: number;
}

/**
 * NavItem component - Renders a single navigation item with proper accessibility
 */
const NavItem = ({
  item,
  isActive,
  isCollapsed,
  onClick,
  tabIndex,
}: NavItemProps) => {
  const Icon = item.icon;

  // Handle keyboard navigation
  const handleKeyDown: React.KeyboardEventHandler<HTMLAnchorElement> = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={item.to}
            className={cn(
              'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              isCollapsed && 'justify-center px-2',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            )}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            tabIndex={tabIndex}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="bg-primary absolute top-0 bottom-0 left-0 w-0.5 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <motion.div
              whileHover={!isActive ? 'hover' : undefined}
              variants={sidebarAnimationVariants.navItem}
              className={cn(
                'flex h-5 w-5 items-center justify-center transition-transform',
                !isActive && 'group-hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
            {!isCollapsed && (
              <span className="truncate text-sm">{item.label}</span>
            )}
            {item.badge && !isCollapsed && (
              <span className="bg-primary/10 text-primary ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium">
                {item.badge}
              </span>
            )}
          </Link>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">{item.label}</TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

// Interface for NavSection props
interface NavSectionProps {
  title: string;
  items: NavItemType[];
  isCollapsed: boolean;
  isActive: (path: string) => boolean;
  onClick?: () => void;
  startTabIndex: number;
}

/**
 * NavSection component - Groups related navigation items
 */
const NavSection = ({
  title,
  items,
  isCollapsed,
  isActive,
  onClick,
  startTabIndex,
}: NavSectionProps) => {
  return (
    <div className="mb-2">
      {!isCollapsed && (
        <h3 className="text-muted-foreground mb-1 px-3 text-xs font-medium">
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
            tabIndex={startTabIndex + index}
          />
        ))}
      </div>
    </div>
  );
};

// Interface for SidebarProps
interface SidebarProps {
  className?: string;
}

/**
 * Enhanced Sidebar component with improved visual design and UX
 */
export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteItems, setFavoriteItems] = useState<NavItemType[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const matches = useMatches();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use the logout mutation from our auth API
  const logoutMutation = useLogout();

  // Fetch current user data
  const {
    data: currentUser,
    isLoading: isLoadingUser,
    error: userError,
  } = useCurrentUser();

  // Filter navigation items based on search query
  const filteredNavItems = searchQuery
    ? navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : navItems;

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!currentUser || !currentUser.username) return 'WP';

    // If we have a full name with spaces, get initials from first and last name
    if (currentUser.username.includes(' ')) {
      const nameParts = currentUser.username.split(' ');
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }

    // Otherwise, use the first two letters of the username
    return currentUser.username.substring(0, 2).toUpperCase();
  };

  // Get formatted role for display
  const getFormattedRole = () => {
    if (!currentUser || !currentUser.role) return 'User';

    // Capitalize first letter of role
    return (
      currentUser.role.charAt(0).toUpperCase() +
      currentUser.role.slice(1).toLowerCase()
    );
  };

  const currentRoute =
    matches.length > 0 ? matches[matches.length - 1].pathname : '/';

  // Fix the isActive function to ensure only exact matching routes are highlighted
  const isActive = (path: string) => {
    // Special case for dashboard - only active when path is exactly '/'
    if (path === '/') {
      return currentRoute === '/';
    }

    // For other routes, check if the current route starts with the path
    // but make sure it's a complete segment match to avoid partial matches
    if (path !== '/') {
      // Ensure we're matching complete segments by checking for / or end of string
      const pathWithTrailingSlash = path.endsWith('/') ? path : `${path}/`;
      return (
        currentRoute === path ||
        currentRoute === path.slice(0, -1) || // Handle trailing slash variations
        currentRoute.startsWith(pathWithTrailingSlash)
      );
    }

    return false;
  };

  // Handle keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !isCollapsed) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  // Handle logout process
  const handleLogout = async () => {
    try {
      // Don't attempt to logout if already in progress
      if (logoutMutation.isPending) return;

      logger.info('Auth', 'Starting logout process');

      // Execute the logout mutation
      await logoutMutation.mutateAsync();

      logger.info('Auth', 'User logged out successfully', {
        username: currentUser?.username,
      });

      // Clear any stored navigation paths
      sessionStorage.removeItem('previousPath');

      // Explicitly invalidate and reset auth state in the query cache
      queryClient.setQueryData(['auth', 'session'], false);
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      logger.info('Auth', 'Auth state explicitly reset in query cache');

      // Show success message
      toast.success('Successfully logged out');

      // Add a small delay to ensure state updates propagate
      setTimeout(() => {
        logger.info('Auth', 'Navigating to login page after logout');
        // Navigate to login page
        navigate({ to: '/login', replace: true });
      }, 100);
    } catch (error) {
      console.error('Logout failed:', error);

      // Even if the logout fails, we should still:

      // 1. Clear any stored navigation paths
      sessionStorage.removeItem('previousPath');

      // 2. Clear any tokens that might be left
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');

      // 3. Explicitly reset auth state in the query cache
      queryClient.setQueryData(['auth', 'session'], false);
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      logger.info('Auth', 'Auth state explicitly reset in query cache');

      // 4. Show a warning to the user
      toast.warning(
        'Logout encountered an issue, but you have been logged out successfully.',
      );

      // 5. Navigate to login page with a delay
      setTimeout(() => {
        logger.info('Auth', 'Navigating to login page after logout error');
        navigate({ to: '/login', replace: true });
      }, 100);
    }
  };

  // Toggle sidebar expanded/collapsed state
  const toggleSidebar = () => {
    if (isDesktop) {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      // Trigger a storage event so MainLayout can detect the change
      localStorage.setItem('sidebarCollapsed', String(newState));
      // Dispatch a storage event to notify other components
      window.dispatchEvent(new Event('storage'));
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  // Store collapsed state in localStorage
  useEffect(() => {
    if (isDesktop) {
      const storedState = localStorage.getItem('sidebarCollapsed');
      if (storedState !== null) {
        setIsCollapsed(storedState === 'true');
      }
    }
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop) {
      localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }
  }, [isCollapsed, isDesktop]);

  // Initialize favorites from localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem('sidebarFavorites');
    if (storedFavorites) {
      try {
        const favoriteUrls = JSON.parse(storedFavorites) as string[];
        const items = navItems.filter(item => favoriteUrls.includes(item.to));
        setFavoriteItems(items);
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  // Group navigation items by section
  const mainNavItems = filteredNavItems.filter(
    item => !item.section || item.section === 'main',
  );

  const managementNavItems = filteredNavItems.filter(
    item => item.section === 'management',
  );

  const systemNavItems = filteredNavItems.filter(
    item => item.section === 'system',
  );

  return (
    <>
      {/* Mobile overlay */}
      {!isDesktop && isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      {!isDesktop && (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 fixed top-4 left-4 z-50 shadow-sm lg:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <motion.aside
        variants={sidebarAnimationVariants.container}
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        className={cn(
          'bg-background flex h-screen flex-col border-r shadow-sm',
          !isDesktop && (isMobileOpen ? 'translate-x-0' : '-translate-x-full'),
          !isDesktop &&
            'fixed top-0 left-0 z-50 transition-transform duration-300',
          className,
        )}
      >
        {/* Header section */}
        <div className="flex h-14 items-center border-b px-3">
          <AnimatePresence initial={false}>
            {!isCollapsed ? (
              <motion.div
                key="full-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 font-semibold"
              >
                <Pill className="text-primary h-5 w-5" />
                <span>WellPharm</span>
              </motion.div>
            ) : (
              <motion.div
                key="icon-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex w-full justify-center"
              >
                <Pill className="text-primary h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search input - only visible when expanded */}
        {!isCollapsed && (
          <div className="relative px-3 py-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-8 pl-8 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <span className="sr-only">Clear search</span>
                  <span aria-hidden="true">×</span>
                </Button>
              )}
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              <kbd className="rounded border px-1 py-0.5 text-xs">Ctrl</kbd>
              <span className="mx-0.5">+</span>
              <kbd className="rounded border px-1 py-0.5 text-xs">K</kbd>
            </div>
          </div>
        )}

        {/* Navigation section */}
        <div className="flex-1 overflow-auto px-2 py-2">
          {/* Favorites section - only show if we have favorites */}
          {favoriteItems.length > 0 && (
            <NavSection
              title="Favorites"
              items={favoriteItems}
              isCollapsed={isCollapsed}
              isActive={isActive}
              onClick={() => !isDesktop && setIsMobileOpen(false)}
              startTabIndex={1}
            />
          )}

          {/* Main navigation items */}
          <NavSection
            title="Main"
            items={mainNavItems}
            isCollapsed={isCollapsed}
            isActive={isActive}
            onClick={() => !isDesktop && setIsMobileOpen(false)}
            startTabIndex={10}
          />

          {/* Management navigation items */}
          {managementNavItems.length > 0 && (
            <NavSection
              title="Management"
              items={managementNavItems}
              isCollapsed={isCollapsed}
              isActive={isActive}
              onClick={() => !isDesktop && setIsMobileOpen(false)}
              startTabIndex={20}
            />
          )}

          {/* System navigation items */}
          {systemNavItems.length > 0 && (
            <NavSection
              title="System"
              items={systemNavItems}
              isCollapsed={isCollapsed}
              isActive={isActive}
              onClick={() => !isDesktop && setIsMobileOpen(false)}
              startTabIndex={30}
            />
          )}
        </div>

        {/* Footer section */}
        <div className="border-t">
          <motion.div
            className={cn(
              'flex items-center rounded-md p-2',
              isCollapsed ? 'justify-center' : 'px-3 py-2',
            )}
            variants={sidebarAnimationVariants.footer}
            initial={false}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
          >
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  key="profile-info"
                  variants={sidebarAnimationVariants.profile}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="flex items-center gap-2"
                >
                  <Avatar className="border-primary/10 h-8 w-8 border">
                    {isLoadingUser ? (
                      <AvatarFallback className="bg-primary/5 text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage
                          src={''}
                          alt={currentUser?.username || 'User'}
                        />
                        <AvatarFallback className="bg-primary/5 text-primary">
                          {getUserInitials()}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="text-sm">
                    {isLoadingUser ? (
                      <div className="space-y-1">
                        <div className="bg-muted h-3 w-20 animate-pulse rounded" />
                        <div className="bg-muted h-2 w-16 animate-pulse rounded" />
                      </div>
                    ) : userError ? (
                      <p className="text-destructive/80 leading-none font-medium">
                        Error
                      </p>
                    ) : (
                      <>
                        <p className="leading-none font-medium">
                          {currentUser?.username || 'Unknown User'}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {getFormattedRole()}
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={cn(
                'flex items-center gap-1',
                !isCollapsed && 'ml-auto',
              )}
            >
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring h-8 w-8 focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      aria-label="Logout"
                    >
                      {logoutMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Logout</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isDesktop && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-muted focus-visible:ring-ring h-8 w-8 focus-visible:ring-2 focus-visible:ring-offset-2"
                        onClick={toggleSidebar}
                        aria-label={
                          isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                        }
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronLeft className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}
