import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import axios from 'axios';
import { BriefcaseBusiness, Building2, CalendarDays, Eye, Mail, MapPin, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';
import type { Application, ApplicationStatus } from '../types/application';
import type { Job } from '../types/job';
import { employmentLabels } from '../utils/jobOptions';
import { useDocumentTitle } from '../utils/useDocumentTitle';

type StatusFilter = 'ALL' | ApplicationStatus;

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
};

const statusClasses: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-sky-50 text-sky-700',
  SHORTLISTED: 'bg-emerald-50 text-emerald-700',
  SELECTED: 'bg-violet-50 text-violet-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

const allowedNextStatuses: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['SELECTED', 'REJECTED'],
  SELECTED: [],
  REJECTED: [],
};

const formatDate = (date: string) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(
    parsedDate,
  );
};

const getErrorMessage = (err: unknown, fallback: string) => {
  const message = axios.isAxiosError<{ message?: string }>(err)
    ? err.response?.data?.message
    : undefined;
  return message || fallback;
};

export const AdminApplications: FC = () => {
  useDocumentTitle('Applications');

  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [updatingApplicationId, setUpdatingApplicationId] = useState<number | null>(null);
  const [statusErrors, setStatusErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    api
      .get<Application[]>('/admin/applications')
      .then((response) => {
        if (active) setApplications(response.data);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, 'Could not load applications. Please try again.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const jobs = useMemo(() => {
    const uniqueJobs = new Map<number, Pick<Application, 'jobId' | 'jobTitle' | 'companyName' | 'jobCode'>>();
    applications.forEach((application) => {
      uniqueJobs.set(application.jobId, {
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        companyName: application.companyName,
        jobCode: application.jobCode,
      });
    });
    return [...uniqueJobs.values()].sort((a, b) => a.jobTitle.localeCompare(b.jobTitle));
  }, [applications]);

  const filteredApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          (statusFilter === 'ALL' || application.status === statusFilter) &&
          (jobFilter === 'ALL' || application.jobId === Number(jobFilter)),
      ),
    [applications, statusFilter, jobFilter],
  );

  const openDetails = async (application: Application) => {
    setSelectedApplication(application);
    setSelectedJob(null);
    setDetailsError('');
    setJobLoading(true);
    try {
      const response = await api.get<Job>(`/jobs/${application.jobId}`);
      setSelectedJob(response.data);
    } catch (err: unknown) {
      setDetailsError(getErrorMessage(err, 'Could not load the full job details.'));
    } finally {
      setJobLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedApplication(null);
    setSelectedJob(null);
    setDetailsError('');
  };

  const updateApplicationStatus = async (application: Application, newStatus: ApplicationStatus) => {
    setUpdatingApplicationId(application.id);
    setStatusErrors((previous) => {
      const next = { ...previous };
      delete next[application.id];
      return next;
    });

    try {
      await api.patch(`/admin/applications/${application.id}/status`, { status: newStatus });
      setApplications((previous) =>
        previous.map((item) =>
          item.id === application.id ? { ...item, status: newStatus } : item,
        ),
      );
      setSelectedApplication((current) =>
        current?.id === application.id ? { ...current, status: newStatus } : current,
      );
    } catch (err: unknown) {
      setStatusErrors((previous) => ({
        ...previous,
        [application.id]: getErrorMessage(err, 'Could not update application status.'),
      }));
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  return (
    <>
      <PageHeader
        section="Admin"
        title="Applications"
        heading="All Applications"
        subtitle="Review candidates and the jobs they applied for."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Filter applications by job</span>
          <select
            value={jobFilter}
            onChange={(event) => setJobFilter(event.target.value)}
            className="h-[50px] w-full rounded-[16px] border border-[#cfdbd2] bg-white px-4 text-[15px] text-[#263d31] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          >
            <option value="ALL">All jobs ({jobs.length})</option>
            {jobs.map((job) => (
              <option key={job.jobId} value={job.jobId}>
                {job.jobTitle} · {job.companyName} ({job.jobCode})
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Filter applications by status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-[50px] w-full rounded-[16px] border border-[#cfdbd2] bg-white px-4 text-[15px] text-[#263d31] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 sm:w-[220px]"
          >
            <option value="ALL">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-5 text-[15px] text-[#53665b]" aria-live="polite">
        Showing {filteredApplications.length} of {applications.length} applications
      </p>

      {loading ? (
        <div role="status" className="flex min-h-48 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <span className="sr-only">Loading applications</span>
        </div>
      ) : error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </p>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-[24px] bg-white px-6 py-16 text-center text-[#53665b] shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
          {applications.length === 0
            ? 'No applications have been submitted yet.'
            : 'No applications match these filters.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-[#f1f6f2] text-[13px] uppercase tracking-wide text-[#53665b]">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Candidate</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Job</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Applied</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ed]">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="text-[14px] text-[#53665b]">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#1b3428]">{application.candidateName}</div>
                      <a
                        href={`mailto:${application.candidateEmail}`}
                        className="mt-1 inline-flex items-center gap-1.5 text-[#168346] hover:underline"
                      >
                        <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                        {application.candidateEmail}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#1b3428]">{application.jobTitle}</div>
                      <div className="mt-1">{application.companyName} · {application.jobCode}</div>
                    </td>
                    <td className="px-6 py-4">{formatDate(application.appliedAt)}</td>
                    <td className="px-6 py-4">
                      <select
                        aria-label={`Status for ${application.candidateName}'s application to ${application.jobTitle}`}
                        value={application.status}
                        disabled={
                          allowedNextStatuses[application.status].length === 0 ||
                          updatingApplicationId !== null
                        }
                        onChange={(event) =>
                          void updateApplicationStatus(
                            application,
                            event.target.value as ApplicationStatus,
                          )
                        }
                        className={`rounded-full border-0 px-3 py-1 text-[13px] font-medium outline-none focus:ring-2 focus:ring-emerald-600/30 disabled:cursor-default disabled:opacity-100 ${statusClasses[application.status]}`}
                      >
                        <option value={application.status}>{statusLabels[application.status]}</option>
                        {allowedNextStatuses[application.status].map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                      {statusErrors[application.id] && (
                        <p role="alert" className="mt-1 max-w-48 text-xs text-rose-700">
                          {statusErrors[application.id]}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => void openDetails(application)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#d7e2d9] px-3 py-2 font-medium text-[#263d31] hover:bg-[#f2f8f3] focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                      >
                        <Eye aria-hidden="true" className="h-4 w-4" />
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedApplication && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-application-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-7 shadow-2xl sm:p-9"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#119b48]">Application #{selectedApplication.id}</p>
                <h2 id="admin-application-details-title" className="mt-2 text-[22px] font-semibold text-[#1b3428]">
                  Candidate and job details
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close application details"
                onClick={closeDetails}
                className="rounded-full p-2 text-[#53665b] hover:bg-[#f1f7f2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              <section>
                <h3 className="font-semibold text-[#1b3428]">Candidate</h3>
                <p className="mt-3 text-[#53665b]">{selectedApplication.candidateName}</p>
                <a
                  href={`mailto:${selectedApplication.candidateEmail}`}
                  className="mt-1 inline-flex items-center gap-2 break-all text-[#168346] hover:underline"
                >
                  <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
                  {selectedApplication.candidateEmail}
                </a>
              </section>

              <section>
                <h3 className="font-semibold text-[#1b3428]">Application</h3>
                <p className="mt-3 text-[#53665b]">
                  Status: {statusLabels[selectedApplication.status]}
                </p>
                <p className="mt-1 text-[#53665b]">
                  Applied: {formatDate(selectedApplication.appliedAt)}
                </p>
              </section>
            </div>

            <section className="mt-7 border-t border-[#edf1ed] pt-6">
              <h3 className="font-semibold text-[#1b3428]">Job details</h3>
              <p className="mt-3 text-lg font-semibold text-[#1b3428]">
                {selectedJob?.title ?? selectedApplication.jobTitle}
              </p>
              <p className="mt-1 text-[#53665b]">
                {selectedJob?.companyName ?? selectedApplication.companyName} ·{' '}
                {selectedJob?.jobCode ?? selectedApplication.jobCode}
              </p>

              {jobLoading ? (
                <p role="status" className="mt-5 text-sm text-[#53665b]">Loading job details…</p>
              ) : detailsError ? (
                <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  {detailsError} The application’s job title, company, and reference are shown above.
                </p>
              ) : selectedJob ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#53665b]">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selectedJob.location}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4" />
                      {employmentLabels[selectedJob.employmentType]}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Deadline: {formatDate(selectedJob.deadline)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {selectedJob.archived ? 'Archived' : selectedJob.status}
                    </span>
                  </div>
                  <p className="mt-5 whitespace-pre-line leading-7 text-[#53665b]">
                    {selectedJob.description}
                  </p>
                  <div className="mt-5">
                    <h4 className="text-sm font-semibold text-[#1b3428]">Required skills</h4>
                    <p className="mt-1 text-sm text-[#53665b]">{selectedJob.requiredSkills}</p>
                  </div>
                </>
              ) : null}
            </section>
          </section>
        </div>
      )}
    </>
  );
};

export default AdminApplications;
