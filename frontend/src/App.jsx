import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/Layout/AdminLayout';
import UserLayout from './components/Layout/UserLayout';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import TrackingList from './pages/admin/TrackingList';
import ManageUsers from './pages/admin/ManageUsers';
import ActivityLog from './pages/admin/ActivityLog';
import UserDashboard from './pages/user/UserDashboard';
import MyRecords from './pages/user/MyRecords';
import TrackingDetail from './pages/TrackingDetail';
import CreateTracking from './pages/CreateTracking';
import TrackLookup from './pages/TrackLookup';
import ApiKeysPage from './pages/ApiKeysPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Loading PartTrack...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Tracking (No login required) */}
      <Route path="/track" element={
        <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col justify-between">
          <header className="border-b border-surface-800 bg-surface-900/70 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white shadow-sm text-sm">
                PT
              </div>
              <span className="font-bold tracking-tight text-surface-50 text-base sm:text-lg">PartTrack</span>
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-primary btn-sm">
                  Dashboard &rarr;
                </Link>
              ) : (
                <Link to="/login" className="btn-secondary btn-sm">
                  Portal Login
                </Link>
              )}
            </div>
          </header>
          <main className="flex-1 py-8 sm:py-12 px-4">
            <TrackLookup />
          </main>
          <footer className="border-t border-surface-800 py-4 text-center text-xs text-surface-500">
            PartTrack &copy; {new Date().getFullYear()} &bull; Professional Automotive Logistics Tracking
          </footer>
        </div>
      } />

      {/* Public Auth Routes */}
      <Route path="/login" element={
        user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <LoginPage />
      } />
      <Route path="/signup" element={
        user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <SignUpPage />
      } />
      <Route path="/forgot-password" element={
        user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <ForgotPasswordPage />
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="tracking" element={<TrackingList />} />
        <Route path="tracking/new" element={<CreateTracking />} />
        <Route path="tracking/:id" element={<TrackingDetail />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="activity" element={<ActivityLog />} />
      </Route>

      {/* User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="user"><UserLayout /></ProtectedRoute>
      }>
        <Route index element={<UserDashboard />} />
        <Route path="records" element={<MyRecords />} />
        <Route path="records/new" element={<CreateTracking />} />
        <Route path="records/:id" element={<TrackingDetail />} />
      </Route>

      {/* Shared — Lookup (requires login) */}
      <Route path="/lookup" element={
        <ProtectedRoute>
          {user?.role === 'admin' ? <AdminLayout /> : <UserLayout />}
        </ProtectedRoute>
      }>
        <Route index element={<TrackLookup />} />
      </Route>

      {/* Shared — API Keys (requires login) */}
      <Route path="/api-keys" element={
        <ProtectedRoute>
          {user?.role === 'admin' ? <AdminLayout /> : <UserLayout />}
        </ProtectedRoute>
      }>
        <Route index element={<ApiKeysPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={
        <Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1e293b' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
