import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { ProtectedRoute, GuestRoute } from "@/components/auth/ProtectedRoute";
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "@/pages/auth";

function Dashboard() {
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <span className="text-xl font-bold text-primary-600">FundorDonate</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              {user?.firstName || user?.username}
            </span>
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              {user?.role}
            </span>
            {!user?.emailVerified && (
              <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                Email not verified
              </span>
            )}
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="container-page py-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.firstName || user?.username}!</p>
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">FundorDonate</h1>
        <p className="mt-2 text-lg text-gray-600">Crowdfunding & Donation Platform</p>
        <div className="mt-8 flex justify-center gap-4">
          <a href="/auth/login" className="btn-primary">
            Sign In
          </a>
          <a href="/auth/register" className="btn-secondary">
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />

      {/* Guest Routes (redirect if authenticated) */}
      <Route
        path="/auth/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/auth/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Email Verification */}
      <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300">404</h1>
              <p className="mt-4 text-lg text-gray-600">Page not found</p>
              <a href="/" className="btn-primary mt-6 inline-block">
                Go home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
