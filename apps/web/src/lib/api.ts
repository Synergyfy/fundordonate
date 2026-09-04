import axios from "axios";
import { API_CONFIG, STORAGE_KEYS } from "./config";

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
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

let refreshTokenPromise: Promise<string> | null = null;

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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      // No tokens at all — user is not authenticated, don't attempt refresh
      if (!refreshToken && !accessToken) {
        return Promise.reject(error);
      }

      // Access token missing but refresh token exists — attempt refresh
      if (!refreshToken) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        dispatchSessionExpired();
        if (!isPublicPath(window.location.pathname)) {
          window.location.href = "/auth/login?reason=session-expired";
        }
        return Promise.reject(error);
      }

      // Deduplicate: if a refresh is already in progress, wait for it
      if (!refreshTokenPromise) {
        refreshTokenPromise = axios
          .post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
          .then((res) => {
            const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data.tokens;
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccess);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefresh);
            return newAccess;
          })
          .catch(() => {
            // Refresh failed — clear everything and signal session expiry
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            dispatchSessionExpired();
            if (!isPublicPath(window.location.pathname)) {
              window.location.href = "/auth/login?reason=session-expired";
            }
            throw new Error("Session expired");
          })
          .finally(() => {
            refreshTokenPromise = null;
          });
      }

      try {
        const newToken = await refreshTokenPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
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

const PUBLIC_PATHS = ["/", "/campaigns", "/auth", "/donate", "/pledge", "/thank-you", "/payment-failed", "/auth/central-hub"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default api;
