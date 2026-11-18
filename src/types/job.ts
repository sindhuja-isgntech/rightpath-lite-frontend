export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP';

/** Mirrors the backend JobResponse DTO. */
export interface Job {
  id: number;
  jobCode: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  requiredSkills: string;
  deadline: string;
  status: string;
  archived: boolean;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}
