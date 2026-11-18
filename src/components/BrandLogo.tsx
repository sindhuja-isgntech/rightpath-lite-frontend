import React from 'react';
import { MapPin } from 'lucide-react';

interface BrandLogoProps {
  /** "pill" = white rounded badge (on dark backgrounds); "plain" = no background. */
  variant?: 'pill' | 'plain';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'pill' }) => (
  <div
    className={
      variant === 'pill'
        ? 'z-10 flex h-[50px] w-fit items-center gap-1.5 rounded-[19px] bg-white px-4 text-[#209b45]'
        : 'flex h-[50px] w-fit items-center gap-1.5 text-[#209b45]'
    }
  >
    <MapPin className="h-6 w-6 shrink-0 stroke-[2.4]" />
    <div className="leading-none">
      <div className="font-display text-[17px] font-bold tracking-tight">Rightpath</div>
      <div className="mt-1 text-[8px] font-medium uppercase tracking-wide text-slate-600">
        Find your right path
      </div>
    </div>
  </div>
);

export default BrandLogo;
