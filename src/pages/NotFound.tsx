import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useDocumentTitle } from '../utils/useDocumentTitle';

export const NotFound: React.FC = () => {
  useDocumentTitle('Page not found');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-4 py-10 font-sans">
      <section
        aria-labelledby="not-found-title"
        className="w-full max-w-xl rounded-[28px] bg-white px-6 py-10 text-center shadow-[0_2px_12px_rgba(15,23,42,0.08)] sm:px-12 sm:py-14"
      >
        <div className="mb-8 flex justify-center">
          <BrandLogo variant="plain" />
        </div>
        <div
          aria-hidden="true"
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5ec] text-[#119b48]"
        >
          <MapPin className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#119b48]">
          Error 404
        </p>
        <h1
          id="not-found-title"
          className="font-display mt-2 text-3xl font-bold tracking-tight text-[#1b3428] sm:text-4xl"
        >
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[#53665b]">
          The page you are looking for may have moved or no longer exists.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#119b48] px-6 text-base font-semibold text-white transition-colors hover:bg-[#0f853e] focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to home
        </Link>
      </section>
    </main>
  );
};

export default NotFound;
