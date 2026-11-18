import { Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './components/DashboardLayout'
import { adminNavItems, candidateNavItems } from './components/navItems'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ComingSoon } from './pages/ComingSoon'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminJobEvents } from './pages/AdminJobEvents'
import { AppliedJobs } from './pages/AppliedJobs'
import { Dashboard } from './pages/Dashboard'
import { ForgotPassword } from './pages/ForgotPassword'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { JobListings } from './pages/JobListings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Candidate area */}
      <Route element={<ProtectedRoute role="CANDIDATE" />}>
        <Route element={<DashboardLayout navItems={candidateNavItems} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {candidateNavItems
            .filter(
              (item) =>
                item.to !== '/dashboard' &&
                item.to !== '/applied-jobs' &&
                item.to !== '/job-events',
            )
            .map((item) => (
              <Route key={item.to} path={item.to} element={<ComingSoon title={item.label} />} />
            ))}
          <Route path="/applied-jobs" element={<AppliedJobs />} />
          <Route path="/job-events" element={<JobListings />} />
          <Route path="/jobs" element={<JobListings />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route element={<DashboardLayout navItems={adminNavItems} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/job-events" element={<AdminJobEvents />} />
          {adminNavItems
            .filter((item) => item.to !== '/admin/dashboard' && item.to !== '/admin/job-events')
            .map((item) => (
              <Route
                key={item.to}
                path={item.to}
                element={<ComingSoon section="Admin" title={item.label} />}
              />
            ))}
        </Route>
      </Route>
    </Routes>
  )
}

export default App
