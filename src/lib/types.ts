export type Role = "submitter" | "reviewer" | "manager";

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
};

export type Activity = {
  id: string;
  at: string;
  userId: string;
  kind: ActivityKind;
  message: string;
  from?: string;
  to?: string;
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
