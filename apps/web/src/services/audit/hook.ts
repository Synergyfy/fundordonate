import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditService } from "./index";

export const auditKeys = {
  all: ["audit"] as const,
  status: () => [...auditKeys.all, "status"] as const,
  sessions: () => [...auditKeys.all, "sessions"] as const,
};

/** The business's 247GBS Audit status (snapshot; auto-refreshed when stale). */
export function useBusinessAuditStatus() {
  return useQuery({
    queryKey: auditKeys.status(),
    queryFn: () => auditService.getStatus(),
  });
}

/** Force a live refresh of the 247GBS Audit snapshot. */
export function useRefreshBusinessAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => auditService.refresh(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}

/** Mirrored 247GBS audit sessions. */
export function useBusinessAuditSessions() {
  return useQuery({
    queryKey: auditKeys.sessions(),
    queryFn: () => auditService.listSessions(),
  });
}
