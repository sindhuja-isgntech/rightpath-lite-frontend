import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/user';
import { homePathFor } from '../utils/routes';

interface ProtectedRouteProps {
  /** When set, only users with this role may see the child routes. */
  role?: Role;
}

/**
 * Renders child routes only for logged-in users; everyone else goes to /login.
 * A logged-in user with the wrong role is sent to their own home page.
 */
export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
        <span
          aria-hidden="true"
          className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"
        />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={homePathFor(user.role)} replace />;

  return <Outlet />;
}
