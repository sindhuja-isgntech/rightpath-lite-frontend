import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Archive, Pencil, Plus } from 'lucide-react';
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
type Notice = { type: 'success' | 'error'; text: string };

export const AdminJobEvents: React.FC = () => {
  useDocumentTitle('Job Events');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [now, setNow] = useState(0);
  const [load, setLoad] = useState<LoadState>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobToArchive, setJobToArchive] = useState<Job | null>(null);
  const [archivingJobId, setArchivingJobId] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const archiveDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = archiveDialogRef.current;
    if (!dialog) return;
    if (jobToArchive && !dialog.open) dialog.showModal();
    if (!jobToArchive && dialog.open) dialog.close();
  }, [jobToArchive]);

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
    setNotice({ type: 'success', text: `Job "${job.title}" was created (${job.jobCode}).` });
  };

  const handleUpdated = (updatedJob: Job) => {
    setJobs((previous) => previous.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
    setEditingJob(null);
    setNotice({ type: 'success', text: `Job "${updatedJob.title}" was updated.` });
  };

  const confirmArchive = async () => {
    if (!jobToArchive) return;
    const job = jobToArchive;
    setArchivingJobId(job.id);
    setNotice(null);
    try {
      await api.patch(`/jobs/${job.id}/archive`);
      setJobs((previous) =>
        previous.map((item) => (item.id === job.id ? { ...item, archived: true } : item)),
      );
      setNotice({ type: 'success', text: `Job "${job.title}" was archived.` });
      setJobToArchive(null);
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setNotice({
        type: 'error',
        text: message || `Could not archive "${job.title}". Please try again.`,
      });
      setJobToArchive(null);
    } finally {
      setArchivingJobId(null);
    }
  };

  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <PageHeader
          section="Admin"
          title="Job Events"
          subtitle="Create and manage job postings"
        />
        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setEditingJob(null);
            setDialogOpen(true);
          }}
          className="flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#12a64b] to-[#10813f] px-5 text-[16px] font-semibold text-white shadow-[0_3px_5px_rgba(15,23,42,0.22)] transition hover:brightness-95 sm:mt-2"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Create Job
        </button>
      </div>

      {notice && (
        <p
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`mb-6 rounded-xl border p-3 text-[15px] ${
            notice.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {notice.text}
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
        <section className="rounded-[28px] bg-white px-5 py-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)] sm:px-10 sm:py-9">
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
            <ul className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sortedJobs.map((job) => {
                const state = jobStateOf(job, now);
                return (
                  <li
                    key={job.id}
                    className="flex min-h-[280px] flex-col justify-between gap-6 rounded-2xl border border-[#e3e8e4] bg-[#f6f7f5] p-6"
                  >
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-[18px] font-semibold text-[#1b3428]" title={job.title}>
                        {job.title}
                      </h3>
                      <p className="mt-2 truncate text-[15px] text-[#5d7266]" title={job.companyName}>
                        {job.companyName}
                      </p>
                      <p className="mt-1 truncate text-[14px] text-[#5d7266]" title={`${job.location} · ${job.jobCode}`}>
                        {job.location} · {job.jobCode}
                      </p>
                      <p className="mt-4 text-[14px] leading-6 text-[#5d7266]">
                        {employmentLabels[job.employmentType]}
                      </p>
                      <p className="text-[14px] leading-6 text-[#5d7266]">
                        Deadline: {formatDeadline(job.deadline)}
                      </p>
                      <p className="text-[14px] leading-6 text-[#5d7266]">Status: {job.status}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-[#e3e8e4] pt-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[14px] font-medium ${badgeClass[state]}`}
                      >
                        {state}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Edit ${job.title}`}
                          title="Edit job"
                          onClick={() => {
                            setNotice(null);
                            setEditingJob(job);
                          }}
                          className="rounded-lg p-2 text-[#53665b] hover:bg-[#e8eee9] hover:text-[#119b48]"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Archive ${job.title}`}
                          title={job.archived ? 'Already archived' : 'Archive job'}
                          disabled={job.archived || archivingJobId !== null}
                          onClick={() => {
                            setNotice(null);
                            setJobToArchive(job);
                          }}
                          className="rounded-lg p-2 text-[#53665b] hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {archivingJobId === job.id ? (
                            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-[#53665b] border-t-transparent" />
                          ) : (
                            <Archive className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
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
        onSaved={handleCreated}
      />
      <CreateJobDialog
        open={editingJob !== null}
        job={editingJob}
        onClose={() => setEditingJob(null)}
        onSaved={handleUpdated}
      />
      <dialog
        ref={archiveDialogRef}
        role="alertdialog"
        aria-labelledby="archive-job-title"
        aria-describedby="archive-job-description"
        onCancel={(event) => {
          if (archivingJobId !== null) event.preventDefault();
          else setJobToArchive(null);
        }}
        onClose={() => setJobToArchive(null)}
        onClick={(event) => {
          if (event.target === archiveDialogRef.current && archivingJobId === null) {
            setJobToArchive(null);
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[24px] bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/40"
      >
        {jobToArchive && (
          <div className="p-6 sm:p-8">
            <h2
              id="archive-job-title"
              className="font-display text-2xl font-bold text-[#1b3428]"
            >
              Archive this job?
            </h2>
            <p className="mt-3 break-words text-base font-semibold text-[#263d31]">
              {jobToArchive.title}
            </p>
            <p id="archive-job-description" className="mt-2 text-sm leading-6 text-[#53665b]">
              Candidates will no longer be able to view or apply to this job. Existing
              applications and their history will be retained. This action cannot be undone.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={archivingJobId !== null}
                onClick={() => setJobToArchive(null)}
                className="h-11 rounded-[14px] border border-[#cfdcd2] px-5 text-sm font-medium text-[#2c4538] hover:bg-[#f3f7f4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archivingJobId !== null}
                onClick={() => void confirmArchive()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {archivingJobId === jobToArchive.id ? 'Archiving…' : 'Archive job'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
};

export default AdminJobEvents;
