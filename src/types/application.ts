export type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'SELECTED' | 'REJECTED';

/** Mirrors the backend ApplicationResponse DTO. */
export interface Application {
  id: number;
  jobId: number;
  jobCode: string;
  jobTitle: string;
  companyName: string;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}
