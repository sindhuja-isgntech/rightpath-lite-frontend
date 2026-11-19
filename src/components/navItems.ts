import {
  Award,
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Video,
} from 'lucide-react';
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
  { to: '/assessments', label: 'Assessments', icon: ClipboardList },
  { to: '/interviews', label: 'Interviews', icon: Video },
  { to: '/results', label: 'Results', icon: Award },
  { to: '/resume', label: 'Resume Management', icon: FileText },
];

export const adminNavItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/job-events', label: 'Job Events', icon: BookOpen },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
];
