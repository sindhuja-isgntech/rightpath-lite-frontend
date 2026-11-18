import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Layers,
  Library,
  MessageSquare,
  UserCheck,
  Users,
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
  { to: '/admin/candidates', label: 'Candidates', icon: UserCheck },
  { to: '/admin/ats-screening', label: 'Screen with ATS', icon: FileSearch },
  { to: '/admin/ai-prompts', label: 'Manage AI Prompts', icon: MessageSquare },
  { to: '/admin/assign-assessment', label: 'Assign Assessment', icon: ClipboardList },
  { to: '/admin/assessment-results', label: 'Assessment Results', icon: ClipboardCheck },
  { to: '/admin/question-bank', label: 'Question Bank', icon: Library },
  { to: '/admin/schedule-interview', label: 'Schedule Interview', icon: CalendarDays },
  { to: '/admin/interview-results', label: 'Interview Results', icon: Video },
  { to: '/admin/bulk-ats', label: 'Bulk ATS Check', icon: Layers },
  { to: '/admin/test-mode', label: 'Test Mode', icon: FlaskConical },
  { to: '/admin/users', label: 'User Management', icon: Users },
];
