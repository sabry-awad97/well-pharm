import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  LineChart,
  Package,
  Pill,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';

// Enhanced NavItem type with additional properties
export interface NavItemType {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  section?: 'main' | 'management' | 'system'; // Group items by section
  badge?: string | number; // Optional badge for notifications
  keywords?: string[]; // Additional search keywords
  children?: NavItemType[]; // Submenu items
}

// Centralized navigation items configuration
export const navItems: NavItemType[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    to: '/',
    section: 'main',
  },
  {
    icon: Package,
    label: 'Inventory',
    to: '/inventory',
    section: 'main',
    badge: '3', // Example notification badge
    children: [
      {
        icon: Package,
        label: 'Management',
        to: '/inventory/management',
        keywords: ['stock', 'products'],
      },
      {
        icon: LineChart,
        label: 'Trends',
        to: '/inventory/trends',
        keywords: ['analytics', 'charts'],
      },
      {
        icon: Package,
        label: 'Expiring',
        to: '/inventory/expiring',
        keywords: ['expiry', 'dates'],
      },
    ],
  },
  {
    icon: Package,
    label: 'Products',
    to: '/products',
    section: 'main',
  },
  {
    icon: Users,
    label: 'Patients',
    to: '/patients',
    section: 'management',
  },
  {
    icon: Pill,
    label: 'Prescriptions',
    to: '/prescriptions',
    section: 'management',
  },
  {
    icon: BarChart3,
    label: 'Reports',
    to: '/reports',
    section: 'management',
  },
  {
    icon: Bell,
    label: 'Notifications',
    to: '/notifications',
    section: 'system',
  },
  {
    icon: FileText,
    label: 'Documentation',
    to: '/docs',
    section: 'system',
  },
  {
    icon: ShieldAlert,
    label: 'Permissions',
    to: '/permissions',
    section: 'system',
  },
  {
    icon: Settings,
    label: 'Settings',
    to: '/settings',
    section: 'system',
  },
];
