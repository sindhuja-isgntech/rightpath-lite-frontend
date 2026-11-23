import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  section: string;
  title: string;
  heading?: string;
  subtitle?: string;
  compact?: boolean;
}

/** Breadcrumb ("Candidate > Dashboard") plus a large page heading. */
export const PageHeader: React.FC<PageHeaderProps> = ({
  section,
  title,
  heading,
  subtitle,
  compact = false,
}) => (
  <header className={compact ? 'mb-4' : 'mb-8'}>
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-[15px] text-[#5d7266]">
        <li>{section}</li>
        <li aria-hidden="true" className="flex">
          <ChevronRight className="h-4 w-4" />
        </li>
        <li aria-current="page" className="font-medium text-[#1b3428]">
          {title}
        </li>
      </ol>
    </nav>
    <h1 className="font-display mt-8 text-[28px] font-bold leading-tight tracking-[-1px] text-[#1b3428] sm:text-[36px]">
      {heading ?? title}
    </h1>
    {subtitle && <p className="mt-2 text-[16px] text-[#53665b]">{subtitle}</p>}
  </header>
);
