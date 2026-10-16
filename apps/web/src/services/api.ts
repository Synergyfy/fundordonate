import libApi from "@/lib/api";
import type { AxiosRequestConfig } from "axios";

/**
 * Shared API client wrapper that delegates to lib/api for seamless Bearer token
 * attachment and automatic token refresh deduplication, while unwrapping
 * standardized NestJS `{ success: true, data: T }` responses.
 */
export const api = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await libApi.get(url, config);
    if (res.data && typeof res.data === "object" && "data" in res.data) {
      return res.data.data;
    }
    return res.data;
  },

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await libApi.post(url, data, config);
    if (res.data && typeof res.data === "object" && "data" in res.data) {
      return res.data.data;
    }
    return res.data;
  },

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await libApi.put(url, data, config);
    if (res.data && typeof res.data === "object" && "data" in res.data) {
      return res.data.data;
    }
    return res.data;
  },

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const res = await libApi.patch(url, data, config);
    if (res.data && typeof res.data === "object" && "data" in res.data) {
      return res.data.data;
    }
    return res.data;
  },

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await libApi.delete(url, config);
    if (res.data && typeof res.data === "object" && "data" in res.data) {
      return res.data.data;
    }
    return res.data;
  },
};

export default api;
