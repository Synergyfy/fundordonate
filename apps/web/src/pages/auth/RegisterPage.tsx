import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { Store, Users } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    userType: "consumer" as "business" | "consumer",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const register = useAuthStore((s) => s.register);
  const centralHubEnabled = useAuthStore((s) => s.centralHubEnabled);
  const centralHubLoading = useAuthStore((s) => s.centralHubLoading);
  const checkCentralHub = useAuthStore((s) => s.checkCentralHub);
  const loginWithCentralHub = useAuthStore((s) => s.loginWithCentralHub);
  const navigate = useNavigate();

  useEffect(() => {
    checkCentralHub();
  }, [checkCentralHub]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword: _, ...registerData } = formData;
      await register(registerData);
      // Business owners go to onboarding, consumers go to dashboard
      if (formData.userType === "business") {
        navigate("/business-owner/onboarding");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Registration failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="text-2xl font-bold text-primary-600">
              FundorDonate
            </Link>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">I want to</label>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, userType: "consumer" }))}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    formData.userType === "consumer"
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Users className="mx-auto h-5 w-5 mb-1" />
                  Support as a Consumer
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, userType: "business" }))}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    formData.userType === "business"
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Store className="mx-auto h-5 w-5 mb-1" />
                  Register my Business
                </button>
              </div>
              {formData.userType === "business" && (
                <p className="mt-2 text-xs text-gray-500">
                  Business owners get access to campaign creation, in-store contributions, leaderboards, and rewards.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field mt-1.5"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field mt-1.5"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field mt-1.5"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="input-field mt-1.5"
                placeholder="johndoe"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field mt-1.5"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field mt-1.5"
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>

            <p className="text-center text-xs text-gray-500">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-primary-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>

          {/* Central Hub SSO */}
          {centralHubEnabled && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">or sign up with</span>
                </div>
              </div>

              <button
                onClick={() => loginWithCentralHub("/")}
                disabled={centralHubLoading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                </svg>
                {centralHubLoading ? "Connecting..." : "Sign up with Central Hub"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden w-1/2 bg-gradient-to-br from-secondary-600 to-secondary-800 lg:flex lg:items-center lg:justify-center">
        <div className="px-12 text-center">
          <h2 className="text-3xl font-bold text-white">
            {formData.userType === "business"
              ? "Grow your business through community impact"
              : "Discover causes you care about"}
          </h2>
          <p className="mt-4 text-lg text-secondary-100">
            {formData.userType === "business"
              ? "Create campaigns, track in-store contributions, and earn rewards for supporting your local community."
              : "Browse campaigns, donate securely, and track the impact of your generosity."}
          </p>
        </div>
      </div>
    </div>
  );
}
