import { ROLE_PERMISSIONS } from "./roleConfig";
import type { Permission, Role, Ticket, TicketStatus, User } from "./types";
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
  return hasPermission(role, "ticket:status");
}

export function hasPermission(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasScope(user: User, ticket: Ticket) {
  return (!user.organizationId || user.organizationId === ticket.organizationId)
    && (!user.projectId || user.projectId === ticket.projectId);
}

export function canManageTicket(user: User, ticket: Ticket, permission: Permission) {
  return hasPermission(user.role, permission) && hasScope(user, ticket);
}

export function assertCanManageTicket(user: User, ticket: Ticket, permission: Permission) {
  if (!canManageTicket(user, ticket, permission)) {
    throw new Error("Forbidden: you do not have permission for this ticket.");
  }
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
  if (!hasScope(user, ticket)) return false;
  return hasPermission(user.role, "ticket:view:scope") ||
    (hasPermission(user.role, "ticket:view:own") && ticket.submitterId === user.id);
}

/** Status changes each role may drive the ticket into. */
export const ALLOWED_TRANSITIONS: Record<Role, TicketStatus[]> = {
  submitter: [],
  reviewer: ["In Triage", "In Progress", "Resolved", "Closed"],
  manager: ["In Triage", "In Progress", "Resolved", "Closed"],
};

export function canAssign(role: Role) {
  return hasPermission(role, "ticket:assign");
}

/** Returns an error message when the assignment is not allowed, otherwise `null`. */
export function checkAssignment(user: User, ticket: Ticket, assigneeId: string, assignee?: User): string | null {
  void assigneeId;
  if (ticket.status === "Closed") return "Closed tickets are read-only.";
  if (!canManageTicket(user, ticket, "ticket:assign")) return "You cannot change assignment for this ticket.";
  if (assignee && (assignee.role !== "reviewer" || assignee.active === false)) {
    return "Assignments require an active reviewer.";
  }
  return null;
}

/** Returns an error message when the status change is not allowed, otherwise `null`. */
export function checkStatusChange(user: User, ticket: Ticket, next: TicketStatus): string | null {
  if (ticket.status === "Closed") return "Closed tickets are read-only.";
  if (!hasScope(user, ticket)) return "You cannot change a ticket outside your scope.";
  if (NEXT_STATUS[ticket.status] !== next) return "That status change is not part of the lifecycle.";
  if (next === "In Progress" && !ticket.assigneeId) {
    return "A ticket cannot move to In Progress without an assignee.";
  }
  if (!canManageTicket(user, ticket, "ticket:status")) {
    return "Only reviewers and managers can change ticket status.";
  }
  if (!ALLOWED_TRANSITIONS[user.role].includes(next)) {
    return "Your role cannot perform this status change.";
  }
  return null;
}

export function checkClose(user: User, ticket: Ticket): string | null {
  if (!hasScope(user, ticket)) return "You cannot close a ticket outside your scope.";
  if (ticket.status !== "Resolved") return "Only resolved tickets can be closed.";
  if (user.role === "submitter" && ticket.submitterId !== user.id) {
    return "You can only close your own tickets.";
  }
  if (user.role !== "reviewer" && user.role !== "manager") {
    return "Only reviewers and managers can close tickets.";
  }
  return null;
}

export function checkNote(user: User, ticket: Ticket): string | null {
  if (ticket.status === "Closed") return "Closed tickets are read-only.";
  if (!canViewTicket(user, ticket)) return "You cannot comment on this ticket.";
  if (!canManageTicket(user, ticket, "ticket:edit")) return "Your role cannot add notes.";
  return null;
}
