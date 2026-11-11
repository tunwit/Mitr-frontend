import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, PaginatedResponse } from "@/types/response";
import type {
  AuditLogAction,
  AuditLogEntry,
  AuditLogFilters,
} from "@/types/type.auditLog";
import { fetchwithauth } from "@/utils/fetcher";

export function useAuditLog(
  shopId: number | null,
  page: number,
  action: AuditLogAction | undefined,
  actorId: string,
) {
  const query = new URLSearchParams({ page: String(page) });
  if (action) {
    query.set("actionType", action.actionType);
    query.set("resourceType", action.resourceType);
  }
  if (actorId) query.set("actorId", actorId);

  return useQuery<PaginatedResponse<AuditLogEntry[]>>({
    queryKey: ["audit-logs", shopId, "page", page, action, actorId],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/audit-logs?${query}`,
        method: "GET",
      }),
    enabled: shopId !== null && shopId > 0,
  });
}

export function useAuditLogFilters(shopId: number | null) {
  return useQuery<ApiResponse<AuditLogFilters>>({
    queryKey: ["audit-logs", shopId, "filters"],
    queryFn: () =>
      fetchwithauth({
        endpoint: `/shops/${shopId}/audit-logs/filters`,
        method: "GET",
      }),
    enabled: shopId !== null && shopId > 0,
  });
}
