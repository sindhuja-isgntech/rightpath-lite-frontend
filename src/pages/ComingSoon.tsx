import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { useDocumentTitle } from '../utils/useDocumentTitle';

interface ComingSoonProps {
  title: string;
  /** Breadcrumb root, e.g. "Candidate" or "Admin". */
  section?: string;
}

/** Placeholder for sidebar pages that are not built yet. */
export const ComingSoon: React.FC<ComingSoonProps> = ({ title, section = 'Candidate' }) => {
  useDocumentTitle(title);

  return (
    <>
      <PageHeader section={section} title={title} />
      <p className="rounded-[28px] bg-white px-8 py-20 text-center text-[17px] text-[#53665b] shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
        This page is coming soon.
      </p>
    </>
  );
};
