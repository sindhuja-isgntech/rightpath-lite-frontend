import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Award, Users, MapPin } from 'lucide-react';
import axios from 'axios';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password,
      });

      const token = response.data.token;
      localStorage.setItem('token', token);
      const userResponse = await axios.get('http://localhost:8080/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userRole = userResponse.data.role;
      if (userRole === 'ADMIN') {
        navigate('/admin/applications');
      } else {
        navigate('/jobs');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-white font-sans lg:flex-row">
      <section
        style={{
          background:
            'radial-gradient(ellipse at top left, #1d2b45 0%, #17253b 55%, #101d30 100%)',
        }}
        className="relative hidden min-h-screen w-full flex-col justify-between overflow-hidden bg-[#17253b] px-[34px] py-[50px] text-white lg:flex lg:w-[49.2%]"
      >
        <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-blue-400/5 blur-3xl" />

        <div className="z-10 flex h-[50px] w-fit items-center gap-1.5 rounded-[19px] bg-white px-4 text-[#209b45]">
          <MapPin className="h-6 w-6 stroke-[2.4]" />
          <div className="leading-none">
            <div className="font-display text-[17px] font-bold tracking-tight">Rightpath</div>
            <div className="mt-1 text-[6px] font-medium uppercase tracking-wide text-slate-500">
              Find your right path
            </div>
          </div>
        </div>

        <div className="z-10 my-auto max-w-[650px]">
          <h1 className="font-display mb-[18px] text-[44px] font-bold leading-[1.25] tracking-[-1.6px] text-white">
            Find the Right Path
            <br />
            to Your Career
          </h1>
          <p className="max-w-[550px] text-[21px] leading-[1.55] text-slate-400">
            AI-powered recruitment platform connecting top talent with the right opportunities.
          </p>

          <div className="mt-[88px] grid grid-cols-3 gap-5">
            <div className="min-h-[132px] rounded-[20px] border border-blue-300/10 bg-blue-900/40 p-6">
              <div className="mb-1 text-[30px] font-bold leading-tight text-white">10K+</div>
              <div className="text-[16px] leading-6 text-slate-400">Candidates Placed</div>
            </div>
            <div className="min-h-[132px] rounded-[20px] border border-blue-300/10 bg-blue-900/40 p-6">
              <div className="mb-1 text-[30px] font-bold leading-tight text-white">500+</div>
              <div className="text-[16px] leading-6 text-slate-400">Companies Trust Us</div>
            </div>
            <div className="min-h-[132px] rounded-[20px] border border-blue-300/10 bg-blue-900/40 p-6">
              <div className="mb-1 text-[30px] font-bold leading-tight text-white">95%</div>
              <div className="text-[16px] leading-6 text-slate-400">Success Rate</div>
            </div>
          </div>
        </div>

        <div className="z-10 flex items-center gap-8 text-[16px] text-slate-400">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Users className="h-5 w-5 text-cyan-400" />
            <span>Smart Matching</span>
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Award className="h-5 w-5 text-cyan-400" />
            <span>AI Assessments</span>
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Shield className="h-5 w-5 text-cyan-400" />
            <span>Proctored Exams</span>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-12 lg:w-[50.8%] lg:px-10">
        <div className="w-full max-w-[550px]">
          <header className="mb-[42px]">
            <h2 className="font-display text-[38px] font-bold leading-tight tracking-[-1px] text-[#1b3428]">
              Welcome back
            </h2>
            <p className="mt-2 text-[17px] text-[#53665b]">Sign in to your RightPath account</p>
          </header>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="rounded-[22px] border border-[#dce5de] bg-white px-10 py-10 shadow-[0_2px_4px_rgba(15,23,42,0.10)]"
          >
            <div>
              <label htmlFor="email" className="mb-[10px] block text-[16px] font-medium text-slate-900">
                Email<span className="ml-0.5 text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-[18px] top-1/2 h-5 w-5 -translate-y-1/2 text-[#789084]" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-[55px] w-full rounded-[20px] border border-[#cfdcd2] bg-white pl-[54px] pr-4 text-[16px] text-slate-900 outline-none placeholder:text-[#778a7f] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="password" className="mb-[10px] block text-[16px] font-medium text-slate-900">
                Password<span className="ml-0.5 text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-[18px] top-1/2 h-5 w-5 -translate-y-1/2 text-[#789084]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-[55px] w-full rounded-[20px] border border-[#cfdcd2] bg-white pl-[54px] pr-14 text-[16px] text-slate-900 outline-none placeholder:text-[#778a7f] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-[17px] text-[#789084] hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <a href="#forgot" className="text-[16px] font-medium text-[#119b48] hover:text-green-800">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-[60px] w-full items-center justify-center gap-3 rounded-[20px] bg-gradient-to-r from-[#12a64b] to-[#10813f] text-[18px] font-semibold text-white shadow-[0_3px_5px_rgba(15,23,42,0.22)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="mt-[28px] text-center text-[16px] text-[#53665b]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-[#119b48] hover:text-green-800">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;
