import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Archive, Briefcase, CalendarDays, CircleDot, Eye, MapPin, Pencil, Plus, Tag, Users } from 'lucide-react';
import { CreateJobDialog } from '../components/CreateJobDialog';
import { JobApplicantsDialog } from '../components/JobApplicantsDialog';
import { JobDetailsDialog } from '../components/JobDetailsDialog';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';
import type { Application } from '../types/application';
import type { Job } from '../types/job';
import { employmentLabels } from '../utils/jobOptions';
import { formatDateTime, jobStateBadgeClass, jobStateOf } from '../utils/jobState';
import { useDocumentTitle } from '../utils/useDocumentTitle';

// Pill-shaped action button used in the two-by-two grid at the foot of each job card
const cardButtonClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe7e1] bg-white px-3 text-[14px] font-medium text-[#263d31] transition-colors hover:bg-[#f2f8f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40';

type LoadState = 'loading' | 'error' | 'ready';
type Notice = { type: 'success' | 'error'; text: string };

export const AdminJobEvents: React.FC = () => {
  useDocumentTitle('Job Events');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsAvailable, setApplicationsAvailable] = useState(true);
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [applicantsJob, setApplicantsJob] = useState<Job | null>(null);
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
    // Jobs are required; applications only feed the applicant counts and the applicants dialog,
    // so the page still works if they fail to load.
    Promise.allSettled([api.get<Job[]>('/jobs'), api.get<Application[]>('/admin/applications')]).then(
      ([jobsResult, applicationsResult]) => {
        if (jobsResult.status === 'rejected') {
          setLoad('error');
          return;
        }
        setJobs(jobsResult.value.data);
        if (applicationsResult.status === 'fulfilled') {
          setApplications(applicationsResult.value.data);
        } else {
          setApplicationsAvailable(false);
        }
        setNow(Date.now());
        setLoad('ready');
      },
    );
  }, []);

  const applicantCounts = new Map<number, number>();
  applications.forEach((application) =>
    applicantCounts.set(application.jobId, (applicantCounts.get(application.jobId) ?? 0) + 1),
  );
  const applicantCountOf = (job: Job): number | null =>
    applicationsAvailable ? (applicantCounts.get(job.id) ?? 0) : null;

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
          className="flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#12a64b] to-[#10813f] px-5 text-[15px] font-semibold text-white shadow-[0_3px_5px_rgba(15,23,42,0.22)] transition hover:brightness-95 sm:mt-2"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Create Job
        </button>
      </div>

      {notice && (
        <p
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`mb-6 rounded-xl border p-3 text-[14px] ${
            notice.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      {load === 'loading' && (
        <p role="status" className="py-16 text-center text-[16px] text-[#53665b]">
          Loading jobs…
        </p>
      )}

      {load === 'error' && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-[16px] text-red-600">
          Could not load jobs. Please check that the server is running and try again.
        </p>
      )}

      {load === 'ready' && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[24px] font-semibold tracking-[-0.5px] text-[#1b3428]">
              All Jobs
            </h2>
            <p className="text-[16px] text-[#5d7266]">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            </p>
          </div>

          {sortedJobs.length === 0 ? (
            <p className="py-14 text-center text-[16px] text-[#53665b]">
              No jobs yet. Use “Create Job” to post the first one.
            </p>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sortedJobs.map((job) => {
                const state = jobStateOf(job, now);
                const applicantCount = applicantCountOf(job);
                return (
                  <li
                    key={job.id}
                    className="flex flex-col rounded-[22px] border border-[#e6ece7] bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className="font-display line-clamp-2 min-w-0 text-[20px] font-semibold leading-snug tracking-[-0.3px] text-[#1b3428]"
                        title={job.title}
                      >
                        {job.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium ${jobStateBadgeClass[state]}`}
                      >
                        {state}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[16px] text-[#53665b]" title={job.companyName}>
                      {job.companyName}
                    </p>

                    <ul className="mt-5 space-y-2.5 text-[15px] text-[#5d7266]">
                      <li className="flex items-center gap-3">
                        <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 break-all">{job.jobCode}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 truncate" title={job.location}>
                          {job.location}
                        </span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{employmentLabels[job.employmentType]}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Deadline: {formatDateTime(job.deadline)}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CircleDot className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Status: {job.status}</span>
                      </li>
                    </ul>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                      <button
                        type="button"
                        aria-label={`View details of ${job.title}`}
                        onClick={() => setViewJob(job)}
                        className={cardButtonClass}
                      >
                        <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
                        View details
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${job.title}`}
                        title="Edit job"
                        onClick={() => {
                          setNotice(null);
                          setEditingJob(job);
                        }}
                        className={cardButtonClass}
                      >
                        <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`View applicants for ${job.title}`}
                        onClick={() => setApplicantsJob(job)}
                        className={cardButtonClass}
                      >
                        <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Applicants{applicantCount !== null ? ` (${applicantCount})` : ''}
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
                        className={`${cardButtonClass} hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#dfe7e1] disabled:hover:bg-white disabled:hover:text-[#263d31]`}
                      >
                        {archivingJobId === job.id ? (
                          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-[#53665b] border-t-transparent" />
                        ) : (
                          <Archive className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        Archive
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <JobDetailsDialog
        job={viewJob}
        now={now}
        applicantCount={viewJob ? applicantCountOf(viewJob) : null}
        onClose={() => setViewJob(null)}
        onViewApplicants={(job) => {
          setViewJob(null);
          setApplicantsJob(job);
        }}
      />
      <JobApplicantsDialog
        job={applicantsJob}
        applications={applications}
        applicationsAvailable={applicationsAvailable}
        onClose={() => setApplicantsJob(null)}
      />
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
              className="font-display text-[22px] font-bold text-[#1b3428]"
            >
              Archive this job?
            </h2>
            <p className="mt-3 break-words text-[15px] font-semibold text-[#263d31]">
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
