import type { EmploymentType } from '../types/job';

export const employmentLabels: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  INTERNSHIP: 'Internship',
};

/** Values for the free-text "status" field on a job (the backend accepts any non-blank text). */
export const JOB_STATUSES = ['OPEN', 'DRAFT', 'CLOSED'] as const;
export type JobStatusValue = (typeof JOB_STATUSES)[number];

export const jobStatusLabels: Record<JobStatusValue, string> = {
  OPEN: 'Open',
  DRAFT: 'Draft',
  CLOSED: 'Closed',
};
