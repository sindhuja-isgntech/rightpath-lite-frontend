import { BookOpen, ClipboardList, FileText, LayoutDashboard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const candidateNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/job-events', label: 'Job Events', icon: BookOpen },
  { to: '/applied-jobs', label: 'Applied Jobs', icon: FileText },
];

export const adminNavItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/job-events', label: 'Job Events', icon: BookOpen },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
];
