import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';
import { useDocumentTitle } from '../utils/useDocumentTitle';

type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'SELECTED' | 'REJECTED';
type StatusFilter = 'ALL' | ApplicationStatus;

interface Application {
  id: number;
  jobId: number;
  jobCode: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string | null;
}

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
};

const statusStyles: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-sky-50 text-sky-700',
  SHORTLISTED: 'bg-emerald-50 text-emerald-700',
  SELECTED: 'bg-violet-50 text-violet-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(date));

const getApplications = () => api.get<Application[]>('/jobs/me/applications');

const getLoadErrorMessage = (err: unknown) => {
  const message = axios.isAxiosError<{ message?: string }>(err)
    ? err.response?.data?.message
    : undefined;
  return message || 'Unable to load your applications. Please try again.';
};

export const AppliedJobs: React.FC = () => {
  useDocumentTitle('Applied Jobs');

  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      const response = await getApplications();
      setApplications(response.data);
    } catch (err: unknown) {
      setError(getLoadErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getApplications()
      .then((response) => {
        if (active) setApplications(response.data);
      })
      .catch((err: unknown) => {
        if (active) setError(getLoadErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !query ||
        [application.jobTitle, application.companyName, application.jobCode].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  return (
    <>
      <PageHeader
        section="Candidate"
        title="Applications"
        heading="My Applications"
        subtitle="Track the status of all your job applications"
      />

      <div className="mb-7 flex flex-col gap-4 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-[18px] top-1/2 h-5 w-5 -translate-y-1/2 text-[#71877b]"
          />
          <span className="sr-only">Search applications</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by job title, company, or prefix..."
            className="h-[52px] w-full rounded-[20px] border border-[#cfdbd2] bg-white pl-[52px] pr-5 text-[16px] text-[#263d31] outline-none placeholder:text-[#71877b] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </label>

        <label className="relative">
          <span className="sr-only">Filter by application status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-[52px] w-full appearance-none rounded-[20px] border border-[#cfdbd2] bg-white pl-5 pr-12 text-[16px] text-[#263d31] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 sm:w-[228px]"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#71877b]"
          />
        </label>
      </div>

      <p className="mb-7 text-[16px] text-[#53665b]" aria-live="polite">
        Showing {filteredApplications.length} of {applications.length}{' '}
        {applications.length === 1 ? 'application' : 'applications'}
      </p>

      {loading ? (
        <div role="status" className="flex min-h-48 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <span className="sr-only">Loading applications</span>
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-rose-200 bg-white px-6 py-12 text-center shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
          <p className="text-[16px] text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError('');
              void loadApplications();
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#cfdbd2] px-5 py-2.5 font-medium text-[#2c4538] hover:bg-[#f1f7f2]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-[24px] border border-[#e1e9e2] bg-white px-6 py-16 text-center shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-[#83988b]" />
          <h2 className="mt-4 text-[20px] font-semibold text-[#1b3428]">No applications yet</h2>
          <p className="mt-2 text-[16px] text-[#53665b]">
            Your job applications will appear here once you apply.
          </p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-[24px] border border-[#e1e9e2] bg-white px-6 py-16 text-center text-[16px] text-[#53665b]">
          No applications match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredApplications.map((application) => (
            <article
              key={application.id}
              className="flex min-h-[356px] max-w-[352px] flex-col rounded-[24px] border border-[#e2e9e3] bg-white p-7 shadow-[0_2px_4px_rgba(15,23,42,0.10)]"
            >
              <div className="mb-1 flex items-start justify-between gap-3">
                <h2 className="min-w-0 truncate text-[20px] font-semibold text-[#1b3428]" title={application.jobTitle}>
                  {application.jobTitle}
                </h2>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-medium ${
                    statusStyles[application.status]
                  }`}
                >
                  {statusLabels[application.status]}
                </span>
              </div>

              <p className="flex items-center gap-2 text-[16px] text-[#53665b]">
                <Building2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="truncate" title={application.companyName}>
                  {application.companyName}
                </span>
              </p>

              <div className="mt-5 space-y-3 text-[16px] text-[#53665b]">
                <p className="flex items-start gap-3">
                  <BriefcaseBusiness aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="break-words">Ref: {application.jobCode}</span>
                </p>
                <p className="flex items-start gap-3">
                  <CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Applied: {formatDate(application.appliedAt)}</span>
                </p>
                <p className="flex items-start gap-3">
                  <Tag aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Status: {statusLabels[application.status]}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApplication(application)}
                className="mt-auto flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] border border-[#d7e2d9] text-[16px] font-medium text-[#263d31] transition-colors hover:bg-[#f2f8f3] focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                View
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedApplication && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedApplication(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-details-title"
            className="w-full max-w-lg rounded-[24px] bg-white p-7 shadow-2xl sm:p-9"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#119b48]">Application details</p>
                <h2 id="application-details-title" className="mt-2 text-2xl font-semibold text-[#1b3428]">
                  {selectedApplication.jobTitle}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close application details"
                onClick={() => setSelectedApplication(null)}
                className="rounded-full p-2 text-[#53665b] hover:bg-[#f1f7f2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-6 space-y-4 text-[16px] text-[#53665b]">
              <div>
                <dt className="font-medium text-[#1b3428]">Company</dt>
                <dd>{selectedApplication.companyName}</dd>
              </div>
              <div>
                <dt className="font-medium text-[#1b3428]">Reference</dt>
                <dd>{selectedApplication.jobCode}</dd>
              </div>
              <div>
                <dt className="font-medium text-[#1b3428]">Status</dt>
                <dd>{statusLabels[selectedApplication.status]}</dd>
              </div>
              <div>
                <dt className="font-medium text-[#1b3428]">Applied on</dt>
                <dd>{formatDate(selectedApplication.appliedAt)}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </>
  );
};

export default AppliedJobs;
