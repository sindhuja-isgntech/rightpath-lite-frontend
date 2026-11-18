import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, ClipboardCheck, Trophy, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { api } from '../services/api';
import { useDocumentTitle } from '../utils/useDocumentTitle';

interface StatCardProps {
  label: string;
  value: number | null;
  icon: LucideIcon;
  tileClass: string;
  iconClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, tileClass, iconClass }) => (
  <div className="flex items-start gap-5 rounded-[28px] bg-white p-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
    <span
      aria-hidden="true"
      className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[18px] ${tileClass}`}
    >
      <Icon className={`h-6 w-6 ${iconClass}`} />
    </span>
    <div>
      <dt className="text-[17px] leading-snug text-[#5d7266]">{label}</dt>
      <dd className="font-display mt-1 text-[36px] font-bold leading-none text-[#1b3428]">
        {value ?? '–'}
      </dd>
    </div>
  </div>
);

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  viewAllTo: string;
  emptyText: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon: Icon, viewAllTo, emptyText }) => (
  <section className="rounded-[28px] bg-white px-10 py-9 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
    <div className="flex items-center justify-between">
      <h2 className="font-display flex items-center gap-3 text-[28px] font-semibold tracking-[-0.5px] text-[#1b3428]">
        <Icon className="h-6 w-6 text-[#119b48]" />
        {title}
      </h2>
      <Link
        to={viewAllTo}
        className="flex items-center gap-2 text-[17px] font-medium text-[#2c4538] hover:text-[#119b48]"
      >
        View All <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
    <p className="py-16 text-center text-[18px] text-[#53665b]">{emptyText}</p>
  </section>
);

export const Dashboard: React.FC = () => {
  useDocumentTitle('Dashboard');

  const { user } = useAuth();
  const [jobsApplied, setJobsApplied] = useState<number | null>(null);

  useEffect(() => {
    // Only application data exists on the backend so far
    api
      .get<unknown[]>('/jobs/me/applications')
      .then((res) => setJobsApplied(res.data.length))
      .catch(() => setJobsApplied(null));
  }, []);

  const firstName = user?.fullName.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader
        section="Candidate"
        title="Dashboard"
        heading={`Welcome back, ${firstName}!`}
        subtitle="Here is an overview of your activities and upcoming events."
      />

      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {/* Assessments, interviews and exams have no backend yet, so they show 0 */}
        <StatCard
          label="Upcoming Assessments"
          value={0}
          icon={ClipboardCheck}
          tileClass="bg-[#e3f5e9]"
          iconClass="text-[#119b48]"
        />
        <StatCard
          label="Upcoming Interviews"
          value={0}
          icon={Video}
          tileClass="bg-[#e0f4f1]"
          iconClass="text-[#0f8f8a]"
        />
        <StatCard
          label="Jobs Applied"
          value={jobsApplied}
          icon={Briefcase}
          tileClass="bg-[#e3f5e9]"
          iconClass="text-[#119b48]"
        />
        <StatCard
          label="Completed Exams"
          value={0}
          icon={Trophy}
          tileClass="bg-[#fdeee3]"
          iconClass="text-[#d9730d]"
        />
      </dl>

      <div className="mt-10 space-y-8">
        <SectionCard
          title="Upcoming Assessments"
          icon={ClipboardCheck}
          viewAllTo="/assessments"
          emptyText="No upcoming assessments."
        />
        <SectionCard
          title="Upcoming Interviews"
          icon={Video}
          viewAllTo="/interviews"
          emptyText="No upcoming interviews."
        />
      </div>
    </>
  );
};

export default Dashboard;
