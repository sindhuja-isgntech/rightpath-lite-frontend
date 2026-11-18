import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useDocumentTitle } from '../utils/useDocumentTitle';

/** Placeholder until password reset exists on the backend. */
export const ForgotPassword: React.FC = () => {
  useDocumentTitle('Forgot password');

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-12 font-sans">
      <div className="w-full max-w-[460px]">
        <BrandLogo variant="plain" />
        <h1 className="font-display mt-10 text-[34px] font-bold leading-tight tracking-[-1px] text-[#1b3428]">
          Forgot your password?
        </h1>
        <p className="mt-3 text-[17px] text-[#53665b]">
          Password reset is coming soon. In the meantime, please contact your administrator.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-2 text-[16px] font-medium text-[#119b48] hover:text-green-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    </main>
  );
};

export default ForgotPassword;
