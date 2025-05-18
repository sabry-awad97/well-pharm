import { useState, useEffect } from 'react';
import { Link, useMatches } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Package,
  Users,
  Pill,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMediaQuery } from '@/hooks/use-media-query';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

const NavItem = ({
  icon,
  label,
  to,
  isActive,
  isCollapsed,
  onClick,
}: NavItemProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={to}
            className={cn(
              'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              isCollapsed && 'justify-center px-2',
            )}
            onClick={onClick}
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
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center transition-transform',
                !isActive && 'group-hover:scale-110',
              )}
            >
              {icon}
            </div>
            {!isCollapsed && <span className="truncate">{label}</span>}
          </Link>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};

interface SidebarProps {
  className?: string;
}

const sidebarAnimationVariants = {
  profile: {
    hidden: { opacity: 0, x: -20, transition: { duration: 0.2 } },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 } },
  },
  container: {
    collapsed: { width: 70, transition: { duration: 0.3, ease: 'easeInOut' } },
    expanded: { width: 240, transition: { duration: 0.3, ease: 'easeInOut' } },
  },
  footer: {
    collapsed: { justifyContent: 'center', transition: { duration: 0.3 } },
    expanded: {
      justifyContent: 'space-between',
      transition: { duration: 0.3 },
    },
  },
};

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const matches = useMatches();
  const navigate = useNavigate();

  const currentRoute =
    matches.length > 0 ? matches[matches.length - 1].pathname : '/';

  const isActive = (path: string) => {
    return currentRoute.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await invoke('logout');
      // Clear the previous path when logging out
      sessionStorage.removeItem('previousPath');
      navigate({ to: '/login' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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

  const navItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: 'Dashboard',
      to: '/',
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: 'Inventory',
      to: '/inventory',
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Patients',
      to: '/patients',
    },
    {
      icon: <Pill className="h-5 w-5" />,
      label: 'Prescriptions',
      to: '/prescriptions',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'Reports',
      to: '/reports',
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: 'Settings',
      to: '/settings',
    },
  ];

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
        <div className="flex h-14 items-center border-b px-4">
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

        {/* Navigation section */}
        <div className="flex-1 overflow-auto py-3">
          <nav className="grid gap-1 px-2">
            {navItems.map(item => (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                isActive={isActive(item.to)}
                isCollapsed={isCollapsed}
                onClick={() => !isDesktop && setIsMobileOpen(false)}
              />
            ))}
          </nav>
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
                    <AvatarImage src="/avatar.png" alt="User" />
                    <AvatarFallback className="bg-primary/5 text-primary">
                      WP
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="leading-none font-medium">Admin User</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Administrator
                    </p>
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
              {isCollapsed ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                        onClick={handleLogout}
                        aria-label="Logout"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Logout</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}

              {isDesktop && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted h-8 w-8"
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
              )}
            </div>
          </motion.div>
        </div>
      </motion.aside>
    </>
  );
}

