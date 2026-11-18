import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import axios from 'axios';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../utils/useDocumentTitle';

const inputClass =
  'h-[55px] w-full rounded-[20px] border border-[#cfdcd2] bg-white pl-[54px] pr-4 text-[16px] text-slate-900 outline-none placeholder:text-[#5f7367] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 aria-[invalid=true]:border-red-400';
const labelClass = 'mb-[10px] block text-[16px] font-medium text-slate-900';
const iconClass =
  'pointer-events-none absolute left-[18px] top-1/2 h-5 w-5 -translate-y-1/2 text-[#789084]';

const ERROR_ID = 'register-error';
const PASSWORD_HINT_ID = 'password-hint';

const steps = [
  'Create your free account',
  'Build your professional profile',
  'Take AI-powered assessments',
  'Get matched with top companies',
];

type FieldName = 'firstName' | 'lastName' | 'email' | 'mobile' | 'password' | 'confirmPassword';

interface FieldError {
  field: FieldName;
  message: string;
}

interface FieldProps {
  id: FieldName;
  label: string;
  icon: LucideIcon;
  type?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  invalid: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}

const Field: React.FC<FieldProps> = ({
  id,
  label,
  icon: Icon,
  type = 'text',
  value,
  placeholder,
  onChange,
  invalid,
  autoComplete,
  inputMode,
  maxLength,
}) => (
  <div>
    <label htmlFor={id} className={labelClass}>
      {label}
    </label>
    <div className="relative">
      <Icon className={iconClass} />
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={invalid}
        aria-describedby={invalid ? ERROR_ID : undefined}
        className={inputClass}
      />
    </div>
  </div>
);

interface PasswordFieldProps {
  id: FieldName;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  invalid: boolean;
  hint?: string;
  hintId?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  value,
  placeholder,
  onChange,
  invalid,
  hint,
  hintId,
}) => {
  const [visible, setVisible] = useState(false);
  const describedBy = [hint ? hintId : null, invalid ? ERROR_ID : null].filter(Boolean).join(' ');

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <Lock className={iconClass} />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          aria-invalid={invalid}
          aria-describedby={describedBy || undefined}
          className={`${inputClass} pr-14`}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 flex items-center pr-[17px] text-[#789084] hover:text-slate-700"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {hint && (
        <p id={hintId} className="mt-2 text-[15px] text-[#53665b]">
          {hint}
        </p>
      )}
    </div>
  );
};

// Mirrors the backend rules in RegisterRequest; returns the first failing field
const validate = (v: Record<FieldName, string>): FieldError | null => {
  if (!v.firstName.trim()) return { field: 'firstName', message: 'First name is required.' };
  if (!v.lastName.trim()) return { field: 'lastName', message: 'Last name is required.' };
  if (!/^\d{10}$/.test(v.mobile)) return { field: 'mobile', message: 'Mobile number must be 10 digits.' };
  if (v.password.length < 8) return { field: 'password', message: 'Password must be at least 8 characters.' };
  if (!/^[A-Z]/.test(v.password))
    return { field: 'password', message: 'Password must start with an uppercase letter.' };
  if (!/[^A-Za-z0-9]/.test(v.password))
    return { field: 'password', message: 'Password must contain a special character.' };
  if (v.password !== v.confirmPassword)
    return { field: 'confirmPassword', message: 'Passwords do not match.' };
  return null;
};

export const Register: React.FC = () => {
  useDocumentTitle('Create account');

  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState<FieldName | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setInvalidField(null);

    const problem = validate({ firstName, lastName, email, mobile, password, confirmPassword });
    if (problem) {
      setError(problem.message);
      setInvalidField(problem.field);
      document.getElementById(problem.field)?.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        mobileNumber: mobile,
        password,
      });

      // The backend logs the new candidate in right away
      await signIn(response.data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isInvalid = (field: FieldName) => invalidField === field;

  return (
    <main className="flex min-h-screen w-full flex-col bg-white font-sans lg:flex-row">
      <aside
        style={{
          background: 'radial-gradient(ellipse at top left, #1d2b45 0%, #17253b 55%, #101d30 100%)',
        }}
        className="relative hidden min-h-screen w-full flex-col justify-between overflow-hidden bg-[#17253b] px-[34px] py-[50px] text-white lg:flex lg:w-[49.2%]"
      >
        <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-blue-400/5 blur-3xl" />

        <BrandLogo />

        <div className="z-10 max-w-[650px]">
          <p className="font-display mb-[18px] text-[44px] font-bold leading-[1.25] tracking-[-1.6px] text-white">
            Start Your Journey
            <br />
            With RightPath
          </p>
          <p className="max-w-[550px] text-[21px] leading-[1.55] text-slate-400">
            Join thousands of candidates who&apos;ve found their perfect career through our platform.
          </p>
        </div>

        <div className="z-10">
          <p
            id="how-it-works"
            className="mb-6 text-[16px] font-medium uppercase tracking-[0.12em] text-slate-400"
          >
            How it works
          </p>
          <ol aria-labelledby="how-it-works" className="space-y-5">
            {steps.map((step, index) => (
              <li key={step} className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full bg-[#119b6a] text-[15px] font-bold text-white"
                >
                  {index + 1}
                </span>
                <span className="text-[18px] text-slate-200">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      <div className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-12 lg:w-[50.8%] lg:px-10">
        <div className="w-full max-w-[550px]">
          <header className="mb-[36px]">
            <h1 className="font-display text-[38px] font-bold leading-tight tracking-[-1px] text-[#1b3428]">
              Create an account
            </h1>
            <p className="mt-2 text-[17px] text-[#53665b]">Join RightPath to get started</p>
          </header>

          {error && (
            <div
              id={ERROR_ID}
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleRegister}
            noValidate
            aria-label="Create an account"
            className="rounded-[22px] border border-[#dce5de] bg-white px-10 py-10 shadow-[0_2px_4px_rgba(15,23,42,0.10)]"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="firstName"
                  label="First Name"
                  icon={User}
                  value={firstName}
                  onChange={setFirstName}
                  invalid={isInvalid('firstName')}
                  placeholder="John"
                  autoComplete="given-name"
                />
                <Field
                  id="lastName"
                  label="Last Name"
                  icon={User}
                  value={lastName}
                  onChange={setLastName}
                  invalid={isInvalid('lastName')}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>

              <Field
                id="email"
                label="Email"
                icon={Mail}
                type="email"
                value={email}
                onChange={setEmail}
                invalid={isInvalid('email')}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Field
                id="mobile"
                label="Mobile Number"
                icon={Phone}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(value) => setMobile(value.replace(/\D/g, ''))}
                invalid={isInvalid('mobile')}
                placeholder="9876543210"
                autoComplete="tel"
              />

              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                invalid={isInvalid('password')}
                placeholder="Create a strong password"
                hint="Must start with uppercase and contain a special character"
                hintId={PASSWORD_HINT_ID}
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                invalid={isInvalid('confirmPassword')}
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex h-[60px] w-full items-center justify-center gap-3 rounded-[20px] bg-gradient-to-r from-[#12a64b] to-[#10813f] text-[18px] font-semibold text-white shadow-[0_3px_5px_rgba(15,23,42,0.22)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                  />
                  <span className="sr-only">Creating your account…</span>
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="mt-[28px] text-center text-[16px] text-[#53665b]">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[#119b48] hover:text-green-800">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Register;
