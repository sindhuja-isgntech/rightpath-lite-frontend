import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { Application } from '../types/application';
import type { Job } from '../types/job';
import { applicationStatusLabels, applicationStatusStyles } from '../utils/applicationStatus';
import { formatDateTime } from '../utils/jobState';
import { Modal } from './Modal';

const TITLE_ID = 'job-applicants-title';

interface JobApplicantsDialogProps {
  job: Job | null;
  /** All applications; the dialog shows only the ones for `job`. */
  applications: Application[];
  /** False when the applications could not be loaded. */
  applicationsAvailable: boolean;
  onClose: () => void;
}

export const JobApplicantsDialog: React.FC<JobApplicantsDialogProps> = ({
  job,
  applications,
  applicationsAvailable,
  onClose,
}) => {
  const applicants = job
    ? applications
        .filter((application) => application.jobId === job.id)
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    : [];

  return (
    <Modal open={job !== null} onClose={onClose} labelledBy={TITLE_ID} maxWidth="max-w-[720px]">
      {job && (
        <>
          <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-6 sm:px-8 sm:pt-7">
            <div className="min-w-0">
              <h2
                id={TITLE_ID}
                className="font-display text-[24px] font-bold tracking-[-0.5px] text-[#1b3428]"
              >
                Applicants
              </h2>
              <p className="mt-1 break-words text-[15px] text-[#53665b]">
                {job.title} · {job.companyName} · <span className="break-all">{job.jobCode}</span>
              </p>
            </div>
            <button
              type="button"
              aria-label="Close applicants"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-[#53665b] hover:bg-[#eef4ef]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            {!applicationsAvailable ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-[15px] text-red-700"
              >
                Could not load applications. Reload the page and try again.
              </p>
            ) : applicants.length === 0 ? (
              <p className="rounded-2xl bg-[#f6f7f5] px-6 py-12 text-center text-[16px] text-[#53665b]">
                No one has applied to this job yet.
              </p>
            ) : (
              <>
                <p className="mb-3 text-[15px] text-[#5d7266]">
                  {applicants.length} {applicants.length === 1 ? 'candidate has' : 'candidates have'}{' '}
                  applied
                </p>
                <ul className="space-y-3">
                  {applicants.map((application) => (
                    <li
                      key={application.id}
                      className="flex flex-col gap-3 rounded-2xl border border-[#e3e8e4] bg-[#f6f7f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-[16px] font-semibold text-[#1b3428]">
                          {application.candidateName}
                        </p>
                        <p className="break-all text-[14px] text-[#53665b]">
                          <a
                            href={`mailto:${application.candidateEmail}`}
                            className="hover:text-[#119b48] hover:underline"
                          >
                            {application.candidateEmail}
                          </a>
                        </p>
                        <p className="mt-1 text-[13px] text-[#5d7266]">
                          Applied {formatDateTime(application.appliedAt)}
                        </p>
                      </div>
                      <span
                        className={`w-fit shrink-0 rounded-full px-3 py-1 text-[13px] font-medium ${
                          applicationStatusStyles[application.status]
                        }`}
                      >
                        {applicationStatusLabels[application.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/admin/applications"
                className="text-[15px] font-medium text-[#119b48] hover:text-green-800 hover:underline"
              >
                Review and update statuses in Applications
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-[14px] border border-[#cfdcd2] px-5 text-[15px] font-medium text-[#2c4538] hover:bg-[#f3f7f4]"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
