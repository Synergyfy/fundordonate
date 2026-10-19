import api from "../api";
import type { AuditSession, AuditStatus } from "./type";

export const auditService = {
  /** The business's 247GBS Audit snapshot (refreshed server-side when stale). */
  async getStatus(): Promise<AuditStatus> {
    return api.get<AuditStatus>("/business/me/audit");
  },

  /** Force a live delegated read from 247GBS Audit. */
  async refresh(): Promise<AuditStatus> {
    return api.post<AuditStatus>("/business/me/audit/refresh");
  },

  /** Mirrored 247GBS audit sessions. */
  async listSessions(): Promise<AuditSession[]> {
    return api.get<AuditSession[]>("/business/me/audit/sessions");
  },
};

export default auditService;
