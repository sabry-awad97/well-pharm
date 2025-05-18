import { Sidebar } from '@/components/layout/sidebar';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [, setIsSidebarCollapsed] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Update sidebar state when screen size changes
  useEffect(() => {
    if (!isDesktop) {
      setIsSidebarCollapsed(true);
    } else {
      // Check localStorage for saved preference when returning to desktop
      const storedState = localStorage.getItem('sidebarCollapsed');
      if (storedState !== null) {
        setIsSidebarCollapsed(storedState === 'true');
      }
    }
  }, [isDesktop]);

  // Listen for sidebar state changes from the Sidebar component
  useEffect(() => {
    const handleStorageChange = () => {
      const storedState = localStorage.getItem('sidebarCollapsed');
      if (storedState !== null) {
        setIsSidebarCollapsed(storedState === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="bg-background flex h-screen w-full overflow-hidden">
      <Sidebar className="z-50 shrink-0" />
      <main
        className={cn(
          'flex-1 overflow-auto transition-all duration-300 ease-in-out',
          !isDesktop && 'ml-0',
        )}
      >
        <div className="h-full px-4 py-4">{children}</div>
      </main>
    </div>
  );
}
