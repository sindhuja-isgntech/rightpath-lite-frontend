import React, { useEffect, useState } from 'react';
import { Activity, Briefcase, CalendarX, CircleCheck, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';
import type { Application } from '../types/application';
import type { Job } from '../types/job';
import { useDocumentTitle } from '../utils/useDocumentTitle';

const RECENT_JOBS_LIMIT = 8;
const CLOSING_SOON_MS = 2 * 24 * 60 * 60 * 1000; // "Deadline within 2 days"

type JobState = 'Active' | 'Expired' | 'Archived';

interface DashboardData {
  jobs: Job[];
  applications: Application[];
  /** Captured once when the data loads, so every number uses the same "now". */
  now: number;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: DashboardData };

const jobStateOf = (job: Job, now: number): JobState => {
  if (job.archived) return 'Archived';
  return new Date(job.deadline).getTime() > now ? 'Active' : 'Expired';
};

const badgeClass: Record<JobState, string> = {
  Active: 'bg-[#e3f5e9] text-[#0f8a40]',
  Expired: 'bg-[#fde8e8] text-[#b42318]',
  Archived: 'bg-slate-200 text-slate-700',
};

interface StatCardProps {
  label: string;
  value: number | null;
  note: string;
  icon: LucideIcon;
  tileClass: string;
  iconClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, note, icon: Icon, tileClass, iconClass }) => (
  <div className="flex items-start justify-between rounded-[28px] bg-white p-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
    <div>
      <dt className="text-[16px] text-[#5d7266]">{label}</dt>
      <dd className="font-display mt-2 text-[30px] font-bold leading-none text-[#1b3428]">
        {value ?? '--'}
      </dd>
      <dd className="mt-3 text-[15px] text-[#5d7266]">{note}</dd>
    </div>
    <span
      aria-hidden="true"
      className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] ${tileClass}`}
    >
      <Icon className={`h-6 w-6 ${iconClass}`} />
    </span>
  </div>
);

export const AdminDashboard: React.FC = () => {
  useDocumentTitle('Admin Dashboard');

  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    Promise.all([api.get<Job[]>('/jobs'), api.get<Application[]>('/admin/applications')])
      .then(([jobsRes, applicationsRes]) =>
        setState({
          status: 'ready',
          data: { jobs: jobsRes.data, applications: applicationsRes.data, now: Date.now() },
        }),
      )
      .catch(() => setState({ status: 'error' }));
  }, []);

  const header = (
    <PageHeader
      section="Admin"
      title="Dashboard"
      heading="Admin Dashboard"
      subtitle="Overview of your recruitment pipeline"
    />
  );

  if (state.status === 'loading') {
    return (
      <>
        {header}
        <p role="status" className="py-16 text-center text-[16px] text-[#53665b]">
          Loading dashboard…
        </p>
      </>
    );
  }

  if (state.status === 'error') {
    return (
      <>
        {header}
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-[16px] text-red-600"
        >
          Could not load the dashboard. Please check that the server is running and try again.
        </p>
      </>
    );
  }

  const { jobs, applications, now } = state.data;

  const activeJobs = jobs.filter((job) => jobStateOf(job, now) === 'Active');
  const closingSoon = activeJobs.filter(
    (job) => new Date(job.deadline).getTime() - now <= CLOSING_SOON_MS,
  );

  const applicationsByJob = new Map<number, number>();
  applications.forEach((app) =>
    applicationsByJob.set(app.jobId, (applicationsByJob.get(app.jobId) ?? 0) + 1),
  );

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_JOBS_LIMIT);

  return (
    <>
      {header}

      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Jobs"
          value={jobs.length}
          note={`${applications.length} applications received`}
          icon={Briefcase}
          tileClass="bg-[#e3f5e9]"
          iconClass="text-[#119b48]"
        />
        <StatCard
          label="Active Jobs"
          value={activeJobs.length}
          note="Open for applications"
          icon={CircleCheck}
          tileClass="bg-[#e3f5e9]"
          iconClass="text-[#119b48]"
        />
        <StatCard
          label="Expired Jobs"
          value={jobs.length - activeJobs.length}
          note="Closed or archived"
          icon={CalendarX}
          tileClass="bg-[#fde8e8]"
          iconClass="text-[#d92d20]"
        />
        <StatCard
          label="Closing Soon"
          value={closingSoon.length}
          note="Deadline within 2 days"
          icon={Clock}
          tileClass="bg-[#fdeee3]"
          iconClass="text-[#d9730d]"
        />
      </dl>

      <section className="mt-10 rounded-[28px] bg-white px-5 py-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)] sm:px-10 sm:py-9">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display flex items-center gap-3 text-lg font-semibold tracking-[-0.5px] text-[#1b3428] sm:text-[24px]">
            <Activity className="h-6 w-6 text-[#119b48]" aria-hidden="true" />
            Recent Job Posts
          </h2>
          <p className="text-[16px] text-[#5d7266]">
            Showing {recentJobs.length} of {jobs.length}
          </p>
        </div>

        {recentJobs.length === 0 ? (
          <p className="py-14 text-center text-[16px] text-[#53665b]">No jobs have been posted yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {recentJobs.map((job) => {
              const jobState = jobStateOf(job, now);
              const count = applicationsByJob.get(job.id) ?? 0;

              return (
                <li
                  key={job.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#e3e8e4] bg-[#f6f7f5] px-6 py-5"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-semibold text-[#1b3428]">{job.title}</h3>
                    <p className="mt-1 truncate text-[15px] text-[#5d7266]">
                      {job.companyName} · {job.location} · {job.jobCode}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:gap-8">
                    <span
                      className={`rounded-full px-3 py-1 text-[14px] font-medium ${badgeClass[jobState]}`}
                    >
                      {jobState}
                    </span>
                    <span className="w-[92px] text-right text-[14px] text-[#5d7266] sm:w-[120px] sm:text-[15px]">
                      {count} {count === 1 ? 'application' : 'applications'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
};

export default AdminDashboard;
