import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateJobDialog } from '../components/CreateJobDialog';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';
import type { Job } from '../types/job';
import { employmentLabels } from '../utils/jobOptions';
import { useDocumentTitle } from '../utils/useDocumentTitle';

type JobState = 'Active' | 'Expired' | 'Archived';

const jobStateOf = (job: Job, now: number): JobState => {
  if (job.archived) return 'Archived';
  return new Date(job.deadline).getTime() > now ? 'Active' : 'Expired';
};

const badgeClass: Record<JobState, string> = {
  Active: 'bg-[#e3f5e9] text-[#0f8a40]',
  Expired: 'bg-[#fde8e8] text-[#b42318]',
  Archived: 'bg-slate-200 text-slate-700',
};

const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

type LoadState = 'loading' | 'error' | 'ready';

export const AdminJobEvents: React.FC = () => {
  useDocumentTitle('Job Events');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [now, setNow] = useState(0);
  const [load, setLoad] = useState<LoadState>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api
      .get<Job[]>('/jobs')
      .then((res) => {
        setJobs(res.data);
        setNow(Date.now());
        setLoad('ready');
      })
      .catch(() => setLoad('error'));
  }, []);

  const handleCreated = (job: Job) => {
    setJobs((prev) => [job, ...prev]);
    setNow(Date.now());
    setDialogOpen(false);
    setNotice(`Job "${job.title}" was created (${job.jobCode}).`);
  };

  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          section="Admin"
          title="Job Events"
          subtitle="Create and manage job postings"
        />
        <button
          type="button"
          onClick={() => {
            setNotice('');
            setDialogOpen(true);
          }}
          className="mt-2 flex h-[48px] shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#12a64b] to-[#10813f] px-5 text-[16px] font-semibold text-white shadow-[0_3px_5px_rgba(15,23,42,0.22)] transition hover:brightness-95"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Create Job
        </button>
      </div>

      {notice && (
        <p
          role="status"
          className="mb-6 rounded-xl border border-green-200 bg-green-50 p-3 text-[15px] text-green-800"
        >
          {notice}
        </p>
      )}

      {load === 'loading' && (
        <p role="status" className="py-16 text-center text-[17px] text-[#53665b]">
          Loading jobs…
        </p>
      )}

      {load === 'error' && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-[16px] text-red-600">
          Could not load jobs. Please check that the server is running and try again.
        </p>
      )}

      {load === 'ready' && (
        <section className="rounded-[28px] bg-white px-10 py-9 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[26px] font-semibold tracking-[-0.5px] text-[#1b3428]">
              All Jobs
            </h2>
            <p className="text-[17px] text-[#5d7266]">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            </p>
          </div>

          {sortedJobs.length === 0 ? (
            <p className="py-14 text-center text-[17px] text-[#53665b]">
              No jobs yet. Use “Create Job” to post the first one.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {sortedJobs.map((job) => {
                const state = jobStateOf(job, now);
                return (
                  <li
                    key={job.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#e3e8e4] bg-[#f6f7f5] px-6 py-5"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-[18px] font-semibold text-[#1b3428]">{job.title}</h3>
                      <p className="mt-1 truncate text-[15px] text-[#5d7266]">
                        {job.companyName} · {job.location} · {job.jobCode}
                      </p>
                      <p className="mt-1 text-[14px] text-[#5d7266]">
                        {employmentLabels[job.employmentType]} · Deadline {formatDeadline(job.deadline)} ·
                        Status: {job.status}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[14px] font-medium ${badgeClass[state]}`}
                    >
                      {state}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <CreateJobDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
};

export default AdminJobEvents;
