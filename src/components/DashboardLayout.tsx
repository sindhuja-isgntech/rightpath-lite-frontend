import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, LogOut, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import type { NavItem } from './navItems';

const initialsOf = (fullName: string) =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

interface DashboardLayoutProps {
  /** Sidebar links; differ for candidates and admins. */
  navItems: NavItem[];
}

/** Sidebar + top bar shell shared by the candidate and admin areas. */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ navItems }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#f8f8f6] font-sans text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:text-[#119b48] focus:shadow-lg"
      >
        Skip to main content
      </a>

      <aside
        className={`sticky top-0 flex h-screen shrink-0 flex-col bg-[#eef4ef] px-2 py-4 transition-[width] duration-200 ${
          collapsed ? 'w-[76px]' : 'w-[260px] lg:w-[292px]'
        } max-md:w-[76px]`}
      >
        <div
          className={`mb-4 hidden items-center px-2 md:flex ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!collapsed && <BrandLogo variant="plain" />}
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-2 text-[#53665b] hover:bg-white/70"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              aria-label={label}
              className={({ isActive }) =>
                `flex h-[48px] shrink-0 items-center gap-4 rounded-[20px] px-4 text-[16px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#b9e3c9] text-[#119b48]'
                    : 'text-[#2c4538] hover:bg-white/70'
                } ${collapsed ? 'justify-center px-0' : ''} max-md:justify-center max-md:px-0`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate max-md:hidden">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[64px] items-center justify-end gap-2 bg-[#eef4ef] px-3 sm:gap-3 sm:px-6 lg:px-8">
          {/* Not implemented yet: disabled so they are not focusable and announced as unavailable */}
          <button
            type="button"
            disabled
            aria-label="Toggle theme (coming soon)"
            title="Coming soon"
            className="hidden rounded-lg p-2.5 text-[#2c4538] opacity-60 disabled:cursor-not-allowed sm:block"
          >
            <Sun className="h-5 w-5" />
          </button>
          <button
            type="button"
            disabled
            aria-label="Notifications (coming soon)"
            title="Coming soon"
            className="hidden rounded-lg p-2.5 text-[#2c4538] opacity-60 disabled:cursor-not-allowed sm:block"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="ml-1 flex min-w-0 items-center gap-2 sm:ml-3 sm:gap-3">
            <span
              aria-hidden="true"
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#119b6a] text-[15px] font-bold text-white ring-2 ring-blue-300/70"
            >
              {user ? initialsOf(user.fullName) : ''}
            </span>
            <span className="hidden max-w-[220px] truncate text-[17px] font-semibold text-[#1b3428] sm:block">
              {user?.fullName}
            </span>
          </div>

          <button
            type="button"
            aria-label="Log out"
            title="Log out"
            onClick={handleLogout}
            className="ml-1 rounded-lg p-2.5 text-[#2c4538] hover:bg-white/70"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
