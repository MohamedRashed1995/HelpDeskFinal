export type Role = "submitter" | "reviewer" | "manager";

export const ROLES = ["submitter", "reviewer", "manager"] as const;
export type Permission =
  | "ticket:view:own"
  | "ticket:view:scope"
  | "ticket:create"
  | "ticket:edit"
  | "ticket:status"
  | "ticket:priority"
  | "ticket:assign"
  | "ticket:bulk"
  | "metrics:view"
  | "audit:view"
  | "ticket:export"
  | "user:role:manage"
  | "user:delete"
  | "auth:config:manage"
  | "rules:manage"
  | "audit:delete"
  | "ticket:delete"
  | "ticket:reopen";

export const DEFAULT_ORGANIZATION_ID = "helpdesk";
export const DEFAULT_PROJECT_ID = "helpdesk-core";

export type TicketStatus =
  | "Open"
  | "In Triage"
  | "In Progress"
  | "Resolved"
  | "Closed";

export type ActivityKind = "note" | "status" | "assignment";

export type AuditAction =
  | "ticket.created"
  | "ticket.assigned"
  | "ticket.status"
  | "ticket.priority"
  | "ticket.resolved"
  | "ticket.closed"
  | "ticket.bulk"
  | "ticket.note";

export type TicketPriority = "Low" | "Normal" | "High" | "Urgent";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  emailVerified?: boolean;
  authProvider?: "firebase" | "demo";
  avatarUrl?: string | null;
  organizationId?: string;
  projectId?: string;
  active?: boolean;
};

/** Shape of a `users/{uid}` document in Firestore. */
export type UserProfileDoc = {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  projectId: string;
  active: boolean;
};

/** Shape of an `auditLogs/{logId}` document in Firestore. */
export type AuditLog = {
  id: string;
  ticketId: string;
  actorId: string;
  action: AuditAction;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  organizationId: string;
  projectId: string;
  actorName?: string;
  actorRole?: Role;
};

export type Activity = {
  id: string;
  at: string;
  userId: string;
  kind: ActivityKind;
  message: string;
  from?: string;
  to?: string;
  ticketId?: string;
  actorName?: string;
  actorRole?: Role;
  action?: string;
  type?: "internal_note" | "status_changed" | "reviewer_assigned" | "priority_changed";
  text?: string;
};

export type Ticket = {
  id: string;
  subject: string;
  category: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  submitterId: string;
  assigneeId: string | null;
  assignedById: string | null;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  activity: Activity[];
  organizationId: string;
  projectId: string;
};

export const CATEGORIES = [
  "Access & Accounts",
  "Hardware",
  "Network",
  "Software",
  "Email",
  "Other",
] as const;

export const PRIORITIES: TicketPriority[] = ["Low", "Normal", "High", "Urgent"];

export const LIFECYCLE: TicketStatus[] = [
  "Open",
  "In Triage",
  "In Progress",
  "Resolved",
  "Closed",
];

export const NEXT_STATUS: Record<TicketStatus, TicketStatus | null> = {
  Open: "In Triage",
  "In Triage": "In Progress",
  "In Progress": "Resolved",
  Resolved: "Closed",
  Closed: null,
};
