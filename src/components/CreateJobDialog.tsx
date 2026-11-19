import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { api } from '../services/api';
import type { EmploymentType, Job } from '../types/job';
import { employmentLabels, JOB_STATUSES, jobStatusLabels } from '../utils/jobOptions';
import type { JobStatusValue } from '../utils/jobOptions';

type FieldName =
  | 'title'
  | 'companyName'
  | 'description'
  | 'location'
  | 'employmentType'
  | 'requiredSkills'
  | 'deadline'
  | 'status';
type FieldErrors = Partial<Record<FieldName, string>>;

interface FormValues {
  title: string;
  companyName: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  requiredSkills: string;
  deadline: string; // datetime-local value, e.g. 2026-12-01T17:00
  status: JobStatusValue;
}

const emptyForm: FormValues = {
  title: '',
  companyName: '',
  description: '',
  location: '',
  employmentType: 'FULL_TIME',
  requiredSkills: '',
  deadline: '',
  status: 'OPEN',
};

const ERROR_ID = 'create-job-error';

const controlClass =
  'w-full rounded-[14px] border border-[#cfdcd2] bg-white px-4 text-[16px] text-slate-900 outline-none placeholder:text-[#5f7367] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 aria-[invalid=true]:border-red-400';
const labelClass = 'mb-2 block text-[15px] font-medium text-slate-900';

const validate = (v: FormValues): FieldErrors => {
  const errors: FieldErrors = {};
  if (!v.title.trim()) errors.title = 'Job title is required.';
  if (!v.companyName.trim()) errors.companyName = 'Company name is required.';
  if (!v.description.trim()) errors.description = 'Description is required.';
  if (!v.location.trim()) errors.location = 'Location is required.';
  if (!v.employmentType) errors.employmentType = 'Select an employment type.';
  if (!v.requiredSkills.trim()) errors.requiredSkills = 'Required skills are required.';
  if (!v.status.trim()) errors.status = 'Select a job status.';

  if (!v.deadline) {
    errors.deadline = 'Application deadline is required.';
  } else {
    const deadline = new Date(v.deadline).getTime();
    if (Number.isNaN(deadline)) {
      errors.deadline = 'Enter a valid application deadline.';
    } else if (deadline <= Date.now()) {
      errors.deadline = 'Application deadline must be in the future.';
    }
  }

  return errors;
};

const backendValidationFields: Record<string, FieldName> = {
  'Title is required': 'title',
  'Company name is required': 'companyName',
  'Description is required': 'description',
  'Location is required': 'location',
  'Employment type is required': 'employmentType',
  'Required skills are required': 'requiredSkills',
  'Application deadline is required': 'deadline',
  'Application deadline must be in the future': 'deadline',
  'Status is required': 'status',
};

const mapBackendValidationErrors = (message?: string): FieldErrors => {
  const errors: FieldErrors = {};
  message?.split(';').forEach((item) => {
    const field = backendValidationFields[item.trim()];
    if (field) errors[field] = `${item.trim()}.`;
  });
  return errors;
};

interface JobFormProps {
  titleId: string;
  job: Job | null;
  onCancel: () => void;
  onSaved: (job: Job) => void;
}

const toDateTimeLocal = (dateTime: string) => {
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(dateTime)) return dateTime.slice(0, 16);
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const JobForm: React.FC<JobFormProps> = ({ titleId, job, onCancel, onSaved }) => {
  const [values, setValues] = useState<FormValues>(() =>
    job
      ? {
          title: job.title,
          companyName: job.companyName,
          description: job.description,
          location: job.location,
          employmentType: job.employmentType,
          requiredSkills: job.requiredSkills,
          deadline: toDateTimeLocal(job.deadline),
          status: job.status as JobStatusValue,
        }
      : emptyForm,
  );
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
    setError('');
  };

  const fieldProps = (id: FieldName) => ({
    id,
    'aria-invalid': Boolean(fieldErrors[id]),
    'aria-describedby': fieldErrors[id] ? `${id}-error` : undefined,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const validationErrors = validate(values);
    setFieldErrors(validationErrors);
    const firstInvalidField = (Object.keys(validationErrors) as FieldName[])[0];
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const request = {
        title: values.title.trim(),
        companyName: values.companyName.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        employmentType: values.employmentType,
        requiredSkills: values.requiredSkills.trim(),
        deadline: values.deadline,
        status: values.status,
      };
      const response = job
        ? await api.put<Job>(`/jobs/${job.id}`, request)
        : await api.post<Job>('/jobs', request);
      onSaved(response.data);
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      const serverErrors = mapBackendValidationErrors(message);
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
        const firstInvalidField = (Object.keys(serverErrors) as FieldName[])[0];
        document.getElementById(firstInvalidField)?.focus();
      } else {
        setError(message || `Could not ${job ? 'update' : 'create'} the job. Please try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby={titleId} className="px-8 pb-8 pt-2">
      {error && (
        <div
          id={ERROR_ID}
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <div className="space-y-5">
        {job ? (
          <div className="rounded-xl bg-[#f1f7f2] px-4 py-3 text-sm text-[#53665b]">
            Job code <span className="font-semibold text-[#1b3428]">{job.jobCode}</span> is
            permanent and cannot be changed.
          </div>
        ) : (
          <p className="rounded-xl bg-[#f1f7f2] px-4 py-3 text-sm text-[#53665b]">
            A unique job code will be generated automatically after creation and cannot be changed.
          </p>
        )}

        <div>
          <label htmlFor="title" className={labelClass}>
            Job title
          </label>
          <input
            {...fieldProps('title')}
            type="text"
            required
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Frontend Developer"
            className={`${controlClass} h-[48px]`}
          />
          {fieldErrors.title && (
            <p id="title-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="companyName" className={labelClass}>
            Company name
          </label>
          <input
            {...fieldProps('companyName')}
            type="text"
            required
            autoComplete="organization"
            value={values.companyName}
            onChange={(e) => set('companyName', e.target.value)}
            placeholder="e.g. iSignTech"
            className={`${controlClass} h-[48px]`}
          />
          {fieldErrors.companyName && (
            <p id="companyName-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.companyName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            {...fieldProps('description')}
            required
            rows={4}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe the role and responsibilities"
            className={`${controlClass} resize-y py-3`}
          />
          {fieldErrors.description && (
            <p id="description-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="location" className={labelClass}>
              Location
            </label>
            <input
              {...fieldProps('location')}
              type="text"
              required
              value={values.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Hyderabad"
              className={`${controlClass} h-[48px]`}
            />
            {fieldErrors.location && (
              <p id="location-error" className="mt-1 text-sm text-red-600">
                {fieldErrors.location}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="employmentType" className={labelClass}>
              Employment type
            </label>
            <select
              {...fieldProps('employmentType')}
              required
              value={values.employmentType}
              onChange={(e) => set('employmentType', e.target.value as EmploymentType)}
              className={`${controlClass} h-[48px]`}
            >
              {(Object.keys(employmentLabels) as EmploymentType[]).map((type) => (
                <option key={type} value={type}>
                  {employmentLabels[type]}
                </option>
              ))}
            </select>
            {fieldErrors.employmentType && (
              <p id="employmentType-error" className="mt-1 text-sm text-red-600">
                {fieldErrors.employmentType}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="requiredSkills" className={labelClass}>
            Required skills
          </label>
          <input
            {...fieldProps('requiredSkills')}
            type="text"
            required
            value={values.requiredSkills}
            onChange={(e) => set('requiredSkills', e.target.value)}
            placeholder="e.g. React, TypeScript, REST APIs"
            className={`${controlClass} h-[48px]`}
          />
          {fieldErrors.requiredSkills && (
            <p id="requiredSkills-error" className="mt-1 text-sm text-red-600">
              {fieldErrors.requiredSkills}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="deadline" className={labelClass}>
              Application deadline
            </label>
            <input
              {...fieldProps('deadline')}
              type="datetime-local"
              required
              value={values.deadline}
              onChange={(e) => set('deadline', e.target.value)}
              className={`${controlClass} h-[48px]`}
            />
            {fieldErrors.deadline && (
              <p id="deadline-error" className="mt-1 text-sm text-red-600">
                {fieldErrors.deadline}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select
              {...fieldProps('status')}
              required
              value={values.status}
              onChange={(e) => set('status', e.target.value as JobStatusValue)}
              className={`${controlClass} h-[48px]`}
            >
              {JOB_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {jobStatusLabels[status]}
                </option>
              ))}
            </select>
            {fieldErrors.status && (
              <p id="status-error" className="mt-1 text-sm text-red-600">
                {fieldErrors.status}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-[48px] rounded-[14px] border border-[#cfdcd2] bg-white px-6 text-[16px] font-medium text-[#2c4538] hover:bg-[#f3f7f4]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex h-[48px] min-w-[140px] items-center justify-center rounded-[14px] bg-gradient-to-r from-[#12a64b] to-[#10813f] px-6 text-[16px] font-semibold text-white shadow-[0_3px_5px_rgba(15,23,42,0.22)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (job ? 'Saving…' : 'Creating…') : job ? 'Save Changes' : 'Create Job'}
        </button>
      </div>
    </form>
  );
};

interface CreateJobDialogProps {
  open: boolean;
  job?: Job | null;
  onClose: () => void;
  onSaved: (job: Job) => void;
}

/** Modal form for posting a new job. Uses the native <dialog> for focus trapping and Esc. */
export const CreateJobDialog: React.FC<CreateJobDialogProps> = ({
  open,
  job = null,
  onClose,
  onSaved,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `job-dialog-title-${job?.id ?? 'new'}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // Clicking the dimmed backdrop (the dialog element itself) closes it
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-[680px] overflow-y-auto rounded-[24px] bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between px-8 pb-4 pt-7">
        <h2 id={titleId} className="font-display text-[26px] font-bold tracking-[-0.5px] text-[#1b3428]">
          {job ? 'Edit Job' : 'Create Job'}
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-lg p-2 text-[#53665b] hover:bg-[#eef4ef]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mounted only while open so the form resets every time it is reopened */}
      {open && <JobForm key={job?.id ?? 'new'} titleId={titleId} job={job} onCancel={onClose} onSaved={onSaved} />}
    </dialog>
  );
};
