import axios from "axios";
import { API_CONFIG, STORAGE_KEYS } from "./config";

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// =============================================================================
// Session Expiry Event
// Dispatched when refresh fails so the auth store can clear state.
// =============================================================================

export const SESSION_EXPIRED_EVENT = "fd:session-expired";

function dispatchSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

// =============================================================================
// Token Refresh Deduplication
// Multiple simultaneous 401s share a single refresh attempt.
// =============================================================================

let refreshTokenPromise: Promise<string | null> | null = null;

// =============================================================================
// Request Interceptor — Attach access token
// =============================================================================

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============================================================================
// Response Interceptor — Handle 401 with refresh
// =============================================================================

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints to prevent recursion
    if (
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/admin/login") ||
      originalRequest.url?.includes("/auth/sso/callback") ||
      originalRequest.url?.includes("/auth/sso/direct-login")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      originalRequest._retry = true;

      const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      // Deduplicate: if a refresh is already in progress, wait for it
      if (!refreshTokenPromise) {
        refreshTokenPromise = axios
          .post(
            `${api.defaults.baseURL}/auth/refresh`,
            storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
            { withCredentials: true }
          )
          .then((res) => {
            const data = res.data?.data ?? res.data;
            const newAccess = data?.tokens?.accessToken || data?.accessToken;
            const newRefresh = data?.tokens?.refreshToken || data?.refreshToken;

            if (newAccess) {
              localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccess);
            }
            if (newRefresh) {
              localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefresh);
            }
            return (newAccess || "cookie-refreshed") as string;
          })
          .catch((refreshError) => {
            // Refresh failed — clear local storage and signal session expiry
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            dispatchSessionExpired();
            if (!isPublicPath(window.location.pathname)) {
              window.location.href = "/auth/login?reason=session-expired";
            }
            throw refreshError;
          })
          .finally(() => {
            refreshTokenPromise = null;
          });
      }

      try {
        const token = await refreshTokenPromise;
        if (token && token !== "cookie-refreshed") {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// =============================================================================
// Public Path Detection
// =============================================================================

const PUBLIC_PATHS = ["/", "/campaigns", "/auth", "/admin/login", "/upgrade", "/donate", "/pledge", "/thank-you", "/payment-failed"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default api;
