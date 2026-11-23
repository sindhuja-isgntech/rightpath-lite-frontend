import type { ApplicationStatus } from '../types/application';

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
};

export const applicationStatusStyles: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-sky-50 text-sky-700',
  SHORTLISTED: 'bg-emerald-50 text-emerald-700',
  SELECTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-50 text-red-700',
};
