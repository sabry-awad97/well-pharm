import {
  BarChart3,
  LayoutDashboard,
  Package,
  Pill,
  Settings,
  Users,
} from 'lucide-react';

export const navItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    to: '/',
  },
  {
    icon: Package,
    label: 'Inventory',
    to: '/inventory',
  },
  {
    icon: Package,
    label: 'Products',
    to: '/products/',
  },
  {
    icon: Users,
    label: 'Patients',
    to: '/patients',
  },
  {
    icon: Pill,
    label: 'Prescriptions',
    to: '/prescriptions',
  },
  {
    icon: BarChart3,
    label: 'Reports',
    to: '/reports',
  },
  {
    icon: Settings,
    label: 'Settings',
    to: '/settings',
  },
];
