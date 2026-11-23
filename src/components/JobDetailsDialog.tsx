import React from 'react';
import { Users, X } from 'lucide-react';
import type { Job } from '../types/job';
import { employmentLabels } from '../utils/jobOptions';
import { formatDateTime, jobStateBadgeClass, jobStateOf } from '../utils/jobState';
import { Modal } from './Modal';

const TITLE_ID = 'job-details-title';

interface JobDetailsDialogProps {
  job: Job | null;
  /** Timestamp used to decide Active / Expired, captured when the data loaded. */
  now: number;
  /** null while the applications are unavailable */
  applicantCount: number | null;
  onClose: () => void;
  onViewApplicants: (job: Job) => void;
}

/** Splits "React, TypeScript" into chips; free text without commas is shown as one chip. */
const skillsOf = (requiredSkills: string): string[] =>
  requiredSkills
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);

export const JobDetailsDialog: React.FC<JobDetailsDialogProps> = ({
  job,
  now,
  applicantCount,
  onClose,
  onViewApplicants,
}) => (
  <Modal open={job !== null} onClose={onClose} labelledBy={TITLE_ID} maxWidth="max-w-[720px]">
    {job && (
      <>
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-6 sm:px-8 sm:pt-7">
          <div className="min-w-0">
            <h2
              id={TITLE_ID}
              className="font-display break-words text-[24px] font-bold tracking-[-0.5px] text-[#1b3428]"
            >
              {job.title}
            </h2>
            <p className="mt-1 break-words text-[16px] text-[#53665b]">{job.companyName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[14px] font-medium ${jobStateBadgeClass[jobStateOf(job, now)]}`}
            >
              {jobStateOf(job, now)}
            </span>
            <button
              type="button"
              aria-label="Close job details"
              onClick={onClose}
              className="rounded-lg p-2 text-[#53665b] hover:bg-[#eef4ef]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-2xl bg-[#f6f7f5] p-5 text-[15px] sm:grid-cols-2">
            <div>
              <dt className="font-medium text-[#1b3428]">Job code</dt>
              <dd className="mt-0.5 break-all text-[#53665b]">{job.jobCode}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#1b3428]">Location</dt>
              <dd className="mt-0.5 break-words text-[#53665b]">{job.location}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#1b3428]">Employment type</dt>
              <dd className="mt-0.5 text-[#53665b]">{employmentLabels[job.employmentType]}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#1b3428]">Status</dt>
              <dd className="mt-0.5 text-[#53665b]">{job.status}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#1b3428]">Application deadline</dt>
              <dd className="mt-0.5 text-[#53665b]">{formatDateTime(job.deadline)}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#1b3428]">Applicants</dt>
              <dd className="mt-0.5 text-[#53665b]">{applicantCount ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#1b3428]">Posted by</dt>
              <dd className="mt-0.5 break-words text-[#53665b]">{job.createdByName ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#1b3428]">Created</dt>
              <dd className="mt-0.5 text-[#53665b]">{formatDateTime(job.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-[#1b3428]">Last updated</dt>
              <dd className="mt-0.5 text-[#53665b]">{formatDateTime(job.updatedAt)}</dd>
            </div>
          </dl>

          <section className="mt-6" aria-labelledby="job-details-skills">
            <h3 id="job-details-skills" className="text-[16px] font-semibold text-[#1b3428]">
              Required skills
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {skillsOf(job.requiredSkills).map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-[#d7e2d9] bg-white px-3 py-1 text-[14px] text-[#2c4538]"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6" aria-labelledby="job-details-description">
            <h3 id="job-details-description" className="text-[16px] font-semibold text-[#1b3428]">
              Description
            </h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-7 text-[#53665b]">
              {job.description}
            </p>
          </section>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-[14px] border border-[#cfdcd2] px-5 text-[15px] font-medium text-[#2c4538] hover:bg-[#f3f7f4]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onViewApplicants(job)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#12a64b] to-[#10813f] px-5 text-[15px] font-semibold text-white shadow-[0_3px_5px_rgba(15,23,42,0.22)] hover:brightness-95"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              View applicants
            </button>
          </div>
        </div>
      </>
    )}
  </Modal>
);
