export type AuditLogAction = { actionType: string; resourceType: string };

export type AuditLogEntry = AuditLogAction & {
  id: number;
  actorId: string;
  resourceId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogFilters = {
  actions: AuditLogAction[];
  actorIds: string[];
};
