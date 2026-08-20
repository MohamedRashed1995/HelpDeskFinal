import type { Role, Ticket, TicketStatus, User } from "./types";
import { NEXT_STATUS } from "./types";

export const ROLES: Role[] = ["submitter", "reviewer", "manager"];

export const DEFAULT_ROLE: Role = "submitter";

export const ROLE_TITLES: Record<Role, string> = {
  submitter: "Submitter",
  reviewer: "Ticket Reviewer",
  manager: "Support Manager",
};

export const STAFF_ROLES: Role[] = ["reviewer", "manager"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

export function isStaff(role: Role) {
  return STAFF_ROLES.includes(role);
}

export function canChangeStatus(role: Role) {
  return role === "manager";
}

/** Roles allowed to reach each protected route. `null` means "any signed-in user". */
export const ROUTE_ROLES: Record<string, Role[] | null> = {
  "/": null,
  "/tickets": null,
  "/tickets/new": null,
  "/tickets/:id": null,
  "/profile": null,
  "/queue": STAFF_ROLES,
  "/analytics": ["manager"],
};

export function canAccessRoute(role: Role, route: string) {
  const allowed = ROUTE_ROLES[route];
  if (allowed === undefined) return false;
  return allowed === null || allowed.includes(role);
}

export function canViewTicket(user: User, ticket: Ticket) {
  return isStaff(user.role) || ticket.submitterId === user.id;
}

/** Status changes each role may drive the ticket into. */
export const ALLOWED_TRANSITIONS: Record<Role, TicketStatus[]> = {
  submitter: [],
  reviewer: [],
  manager: ["In Triage", "In Progress", "Resolved", "Closed"],
};

export function canAssign(role: Role) {
  return role === "manager";
}

/** Returns an error message when the assignment is not allowed, otherwise `null`. */
export function checkAssignment(user: User, ticket: Ticket, assigneeId: string): string | null {
  void assigneeId;
  if (ticket.status === "Closed") return "Closed tickets are read-only.";
  if (!canAssign(user.role)) return "Your role cannot change assignment.";
  return null;
}

/** Returns an error message when the status change is not allowed, otherwise `null`. */
export function checkStatusChange(user: User, ticket: Ticket, next: TicketStatus): string | null {
  if (ticket.status === "Closed") return "Closed tickets are read-only.";
  if (NEXT_STATUS[ticket.status] !== next) return "That status change is not part of the lifecycle.";
  if (next === "In Progress" && !ticket.assigneeId) {
    return "A ticket cannot move to In Progress without an assignee.";
  }
  if (!canChangeStatus(user.role)) {
    return "Only managers can change ticket status.";
  }
  if (!ALLOWED_TRANSITIONS[user.role].includes(next)) {
    return "Your role cannot perform this status change.";
  }
  return null;
}

export function checkClose(user: User, ticket: Ticket): string | null {
  if (ticket.status !== "Resolved") return "Only resolved tickets can be closed.";
  if (user.role === "submitter" && ticket.submitterId !== user.id) {
    return "You can only close your own tickets.";
  }
  if (user.role !== "manager") {
    return "Your role cannot close tickets.";
  }
  return null;
}

export function checkNote(user: User, ticket: Ticket): string | null {
  if (ticket.status === "Closed") return "Closed tickets are read-only.";
  if (!canViewTicket(user, ticket)) return "You cannot comment on this ticket.";
  return null;
}
