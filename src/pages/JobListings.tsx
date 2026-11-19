import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  Tag,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';
import { useDocumentTitle } from '../utils/useDocumentTitle';

type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP';
type EmploymentFilter = 'ALL' | EmploymentType;
type AvailabilityFilter = 'ACTIVE' | 'CLOSING_SOON' | 'EXPIRED' | 'ALL';
type JobStatus = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

interface Job {
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
}

interface Application {
  jobId: number;
}

type ListingActionMessage = {
  type: 'success' | 'error';
  text: string;
};

const CLOSING_SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const employmentLabels: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  INTERNSHIP: 'Internship',
};

const availabilityLabels: Record<AvailabilityFilter, string> = {
  ACTIVE: 'active',
  CLOSING_SOON: 'closing soon',
  EXPIRED: 'expired',
  ALL: 'all',
};

const getJobListings = async () => {
  const [jobs, applications] = await Promise.allSettled([
    api.get<Job[]>('/jobs'),
    api.get<Application[]>('/jobs/me/applications'),
  ]);
  return { jobs, applications };
};

const getRequestError = (err: unknown, fallback: string) => {
  const message = axios.isAxiosError<{ message?: string }>(err)
    ? err.response?.data?.message
    : undefined;
  return message || fallback;
};

const formatDate = (date: string) => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(parsedDate);
};

const getSkills = (skills: string) =>
  skills
    .split(/[,;|]/)
    .map((skill) => skill.trim())
    .filter(Boolean);

const getJobStatus = (job: Job, referenceTime: number): JobStatus | null => {
  if (job.archived) return 'INACTIVE';
  if (job.status.toUpperCase() !== 'OPEN') return 'INACTIVE';

  const deadline = new Date(job.deadline).getTime();
  if (Number.isNaN(deadline)) return null;
  if (deadline <= referenceTime) return 'EXPIRED';
  return 'ACTIVE';
};

const isClosingSoon = (job: Job, referenceTime: number) => {
  const deadline = new Date(job.deadline).getTime();
  return (
    getJobStatus(job, referenceTime) === 'ACTIVE' &&
    deadline <= referenceTime + CLOSING_SOON_WINDOW_MS
  );
};

export const JobListings: FC = () => {
  useDocumentTitle('Available Jobs');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(() => new Set());
  const [referenceTime, setReferenceTime] = useState(0);
  const [search, setSearch] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentFilter>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applicationLoadError, setApplicationLoadError] = useState('');
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<ListingActionMessage | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loadListings = useCallback(async () => {
    setError('');
    setApplicationLoadError('');
    try {
      const { jobs: jobResult, applications: applicationResult } = await getJobListings();
      if (jobResult.status === 'fulfilled') {
        setJobs(jobResult.value.data);
        setReferenceTime(Date.now());
      } else {
        setError(getRequestError(jobResult.reason, 'Unable to load jobs. Please try again.'));
      }

      if (applicationResult.status === 'fulfilled') {
        setAppliedJobIds(
          new Set(applicationResult.value.data.map((application) => application.jobId)),
        );
      } else {
        setApplicationLoadError(
          getRequestError(
            applicationResult.reason,
            'Could not load your application statuses. Jobs are still available.',
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getJobListings().then(({ jobs: jobResult, applications: applicationResult }) => {
      if (!active) return;

      if (jobResult.status === 'fulfilled') {
        setJobs(jobResult.value.data);
        setReferenceTime(Date.now());
      } else {
        setError(getRequestError(jobResult.reason, 'Unable to load jobs. Please try again.'));
      }

      if (applicationResult.status === 'fulfilled') {
        setAppliedJobIds(
          new Set(applicationResult.value.data.map((application) => application.jobId)),
        );
      } else {
        setApplicationLoadError(
          getRequestError(
            applicationResult.reason,
            'Could not load your application statuses. Jobs are still available.',
          ),
        );
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<JobStatus | 'ALL' | 'CLOSING_SOON', number> = {
      ACTIVE: 0,
      CLOSING_SOON: 0,
      EXPIRED: 0,
      INACTIVE: 0,
      ALL: 0,
    };

    for (const job of jobs) {
      const status = getJobStatus(job, referenceTime);
      if (status) {
        counts[status] += 1;
        counts.ALL += 1;
        if (isClosingSoon(job, referenceTime)) counts.CLOSING_SOON += 1;
      }
    }

    return counts;
  }, [jobs, referenceTime]);

  const availableJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const status = getJobStatus(job, referenceTime);
        if (availabilityFilter === 'ALL') return status !== null;
        if (availabilityFilter === 'CLOSING_SOON') return isClosingSoon(job, referenceTime);
        return status === availabilityFilter;
      }),
    [jobs, referenceTime, availabilityFilter],
  );
  const listingDescription =
    availabilityFilter === 'ALL' ? 'jobs' : `${availabilityLabels[availabilityFilter]} jobs`;

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return availableJobs.filter((job) => {
      const matchesSearch =
        !query ||
        [job.title, job.companyName, job.location, job.jobCode, job.requiredSkills].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesEmployment =
        employmentFilter === 'ALL' || job.employmentType === employmentFilter;
      return matchesSearch && matchesEmployment;
    });
  }, [availableJobs, search, employmentFilter]);

  const applyForJob = async (jobId: number) => {
    setApplyingJobId(jobId);
    setActionMessage(null);

    try {
      await api.post(`/jobs/${jobId}/apply`);
      setAppliedJobIds((current) => new Set(current).add(jobId));
      setActionMessage({ type: 'success', text: 'Your application was submitted successfully.' });
    } catch (err: unknown) {
      setActionMessage({
        type: 'error',
        text: getRequestError(err, 'Unable to submit your application. Please try again.'),
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <>
      <PageHeader
        section="Candidate"
        title="Events"
        heading="Available Jobs"
        compact
      />

      <div className="mb-7 flex flex-col gap-4 lg:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-[18px] top-1/2 h-5 w-5 -translate-y-1/2 text-[#71877b]"
          />
          <span className="sr-only">Search jobs</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search jobs by title, company, skills, location..."
            className="h-[52px] w-full rounded-[20px] border border-[#cfdbd2] bg-white pl-[52px] pr-5 text-[16px] text-[#263d31] outline-none placeholder:text-[#71877b] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
          />
        </label>

        <label className="relative">
          <span className="sr-only">Filter by employment type</span>
          <select
            value={employmentFilter}
            onChange={(event) => setEmploymentFilter(event.target.value as EmploymentFilter)}
            className="h-[52px] w-full appearance-none rounded-[20px] border border-[#cfdbd2] bg-white pl-5 pr-12 text-[16px] text-[#263d31] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 lg:w-[206px]"
          >
            <option value="ALL">All Types</option>
            {Object.entries(employmentLabels).map(([value, label]) => (
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

        <label className="relative">
          <span className="sr-only">Filter by availability</span>
          <select
            value={availabilityFilter}
            onChange={(event) =>
              setAvailabilityFilter(event.target.value as AvailabilityFilter)
            }
            className="h-[52px] w-full appearance-none rounded-[20px] border border-[#cfdbd2] bg-white pl-5 pr-12 text-[16px] text-[#263d31] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 lg:w-[206px]"
          >
            <option value="ACTIVE">Active ({statusCounts.ACTIVE})</option>
            <option value="CLOSING_SOON">Closing soon ({statusCounts.CLOSING_SOON})</option>
            <option value="EXPIRED">Expired ({statusCounts.EXPIRED})</option>
            <option value="ALL">All statuses ({statusCounts.ALL})</option>
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[#71877b]"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[16px] text-[#53665b]" aria-live="polite">
          {loading
            ? 'Loading jobs…'
            : `Showing ${filteredJobs.length ? '1' : '0'}–${filteredJobs.length} of ${
                availableJobs.length
              } ${listingDescription}`}
        </p>
        {actionMessage && (
          <p
            role={actionMessage.type === 'error' ? 'alert' : 'status'}
            className={`text-sm ${
              actionMessage.type === 'error' ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {actionMessage.text}
          </p>
        )}
      </div>

      {applicationLoadError && !error && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          Jobs loaded, but your application statuses could not be checked: {applicationLoadError}
        </p>
      )}

      {loading ? (
        <div role="status" className="flex min-h-48 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <span className="sr-only">Loading jobs</span>
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-rose-200 bg-white px-6 py-12 text-center shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
          <p className="text-[16px] text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError('');
              void loadListings();
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#cfdbd2] px-5 py-2.5 font-medium text-[#2c4538] hover:bg-[#f1f7f2]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : availableJobs.length === 0 ? (
        <div className="rounded-[24px] border border-[#e1e9e2] bg-white px-6 py-16 text-center shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
          <BriefcaseBusiness className="mx-auto h-9 w-9 text-[#83988b]" />
          <h2 className="mt-4 text-[20px] font-semibold text-[#1b3428]">No open jobs right now</h2>
          <p className="mt-2 text-[16px] text-[#53665b]">Check back soon for new opportunities.</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-[24px] border border-[#e1e9e2] bg-white px-6 py-16 text-center text-[16px] text-[#53665b]">
          No jobs match your search. Try another title, company, location, or skill.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => {
            const skills = getSkills(job.requiredSkills);
            const alreadyApplied = appliedJobIds.has(job.id);
            const jobStatus = getJobStatus(job, referenceTime);

            return (
              <article
                key={job.id}
                className="flex min-h-[386px] flex-col rounded-[24px] border border-[#e2e9e3] bg-white p-7 shadow-[0_2px_4px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-[21px] font-semibold text-[#1b3428]" title={job.title}>
                      {job.title}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-[16px] text-[#53665b]">
                      <Building2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                      <span className="truncate">{job.companyName}</span>
                    </p>
                  </div>
                  {alreadyApplied ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e8f5ec] px-3 py-1 text-[13px] font-medium text-[#168346]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Applied
                    </span>
                  ) : jobStatus === 'ACTIVE' && isClosingSoon(job, referenceTime) ? (
                    <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-[13px] font-medium text-amber-700">
                      Closing soon
                    </span>
                  ) : jobStatus === 'EXPIRED' ? (
                    <span className="shrink-0 rounded-full bg-rose-50 px-3 py-1 text-[13px] font-medium text-rose-700">
                      Expired
                    </span>
                  ) : jobStatus === 'INACTIVE' ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[13px] font-medium text-slate-600">
                      Inactive
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3 text-[16px] text-[#53665b]">
                  <p className="flex items-center gap-3">
                    <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {job.location}
                  </p>
                  <p className="flex items-center gap-3">
                    <BriefcaseBusiness aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {employmentLabels[job.employmentType]}
                  </p>
                  <p className="flex items-center gap-3">
                    <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" />
                    Deadline: {formatDate(job.deadline)}
                  </p>
                </div>

                {skills.length > 0 && (
                  <div className="mt-5 flex items-start gap-3">
                    <Tag aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#64796d]" />
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-[#f0f3f0] px-3 py-1 text-[13px] text-[#496252]"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className="rounded-full bg-[#f0f3f0] px-3 py-1 text-[13px] text-[#496252]">
                          +{skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="inline-flex h-[43px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[18px] border border-[#d7e2d9] px-3 text-[15px] font-medium text-[#263d31] transition-colors hover:bg-[#f2f8f3] focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  >
                    <Eye aria-hidden="true" className="h-4 w-4 shrink-0" />
                    Details
                  </button>

                  {alreadyApplied ? (
                    <Link
                      to="/applied-jobs"
                      className="inline-flex h-[43px] min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-[18px] border border-[#d7e2d9] px-3 text-[15px] font-medium text-[#263d31] transition-colors hover:bg-[#f2f8f3]"
                    >
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                      <span className="truncate">View Application</span>
                    </Link>
                  ) : jobStatus !== 'ACTIVE' ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-[43px] min-w-0 flex-1 items-center justify-center rounded-[18px] bg-slate-100 px-3 text-[15px] font-medium text-slate-500"
                    >
                      {jobStatus === 'EXPIRED' ? 'Expired' : 'Unavailable'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={applyingJobId !== null}
                      onClick={() => void applyForJob(job.id)}
                      className="inline-flex h-[43px] min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-[18px] bg-[#119b48] px-3 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0f853e] disabled:cursor-wait disabled:opacity-70"
                    >
                      {applyingJobId === job.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          Apply Now
                          <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedJob && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedJob(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-7 shadow-2xl sm:p-9"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#119b48]">{selectedJob.companyName}</p>
                <h2 id="job-details-title" className="mt-2 text-2xl font-semibold text-[#1b3428]">
                  {selectedJob.title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close job details"
                onClick={() => setSelectedJob(null)}
                className="rounded-full p-2 text-[#53665b] hover:bg-[#f1f7f2]"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-[15px] text-[#53665b]">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selectedJob.location}
              </span>
              <span className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4" />
                {employmentLabels[selectedJob.employmentType]}
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Deadline: {formatDate(selectedJob.deadline)}
              </span>
            </div>
            <p className="mt-6 whitespace-pre-line leading-7 text-[#53665b]">
              {selectedJob.description}
            </p>
            {getSkills(selectedJob.requiredSkills).length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-[#1b3428]">Required skills</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getSkills(selectedJob.requiredSkills).map((skill) => (
                    <span key={skill} className="rounded-full bg-[#f0f3f0] px-3 py-1 text-sm text-[#496252]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8 flex justify-end">
              {appliedJobIds.has(selectedJob.id) ? (
                <Link
                  to="/applied-jobs"
                  className="inline-flex h-11 items-center gap-2 rounded-[16px] border border-[#d7e2d9] px-5 font-medium text-[#263d31] hover:bg-[#f2f8f3]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  View Application
                </Link>
              ) : getJobStatus(selectedJob, referenceTime) !== 'ACTIVE' ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-11 items-center gap-2 rounded-[16px] bg-slate-100 px-5 font-semibold text-slate-500"
                >
                  {getJobStatus(selectedJob, referenceTime) === 'EXPIRED' ? 'Expired' : 'Unavailable'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={applyingJobId !== null}
                  onClick={() => void applyForJob(selectedJob.id)}
                  className="inline-flex h-11 items-center gap-2 rounded-[16px] bg-[#119b48] px-5 font-semibold text-white hover:bg-[#0f853e] disabled:opacity-70"
                >
                  {applyingJobId === selectedJob.id ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Apply Now
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default JobListings;
