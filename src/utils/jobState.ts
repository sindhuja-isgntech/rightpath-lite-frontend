import type { Job } from '../types/job';

export type JobState = 'Active' | 'Expired' | 'Archived';

/** Archived if an admin archived it; otherwise Expired once the deadline has passed; otherwise Active. */
export const jobStateOf = (job: Job, now: number): JobState => {
  if (job.archived) return 'Archived';
  return new Date(job.deadline).getTime() > now ? 'Active' : 'Expired';
};

export const jobStateBadgeClass: Record<JobState, string> = {
  Active: 'bg-[#e3f5e9] text-[#0f8a40]',
  Expired: 'bg-[#fde8e8] text-[#b42318]',
  Archived: 'bg-slate-200 text-slate-700',
};

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
