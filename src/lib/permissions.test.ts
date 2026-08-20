import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROLE,
  canAccessRoute,
  canViewTicket,
  canManageTicket,
  checkAssignment,
  checkClose,
  checkNote,
  checkStatusChange,
  isStaff,
  hasPermission,
} from "./permissions";
import type { Role, Ticket, TicketStatus, User } from "./types";

function makeUser(role: Role, id = `u-${role}`): User {
  return {
    id,
    name: role,
    email: `${role}@acme.com`,
    role,
    title: role,
    emailVerified: true,
    authProvider: "firebase",
    avatarUrl: null,
  };
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  const now = new Date().toISOString();
  return {
    id: "HD-1000",
    subject: "Laptop will not boot",
    category: "Hardware",
    description: "It stays on the vendor logo.",
    status: "Open",
    priority: "Normal",
    submitterId: "u-submitter",
    assigneeId: null,
    assignedById: null,
    assignedAt: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    closedAt: null,
    activity: [],
    organizationId: "helpdesk",
    projectId: "helpdesk-core",
    ...overrides,
  };
}

describe("roles", () => {
  it("defaults new accounts to submitter", () => {
    expect(DEFAULT_ROLE).toBe("submitter");
  });

  it("maps centralized permissions by role", () => {
    expect(hasPermission("manager", "ticket:priority")).toBe(true);
    expect(hasPermission("manager", "ticket:assign")).toBe(true);
    expect(hasPermission("reviewer", "ticket:view:scope")).toBe(true);
    expect(hasPermission("reviewer", "ticket:priority")).toBe(false);
    expect(hasPermission("submitter", "ticket:view:scope")).toBe(false);
  });

  it("treats reviewer and manager as staff", () => {
    expect(isStaff("reviewer")).toBe(true);
    expect(isStaff("manager")).toBe(true);
    expect(isStaff("submitter")).toBe(false);
  });
});

describe("route permissions", () => {
  it("lets any signed-in role reach shared routes", () => {
    for (const role of ["submitter", "reviewer", "manager"] as Role[]) {
      expect(canAccessRoute(role, "/")).toBe(true);
      expect(canAccessRoute(role, "/tickets")).toBe(true);
    }
  });

  it("keeps submitters out of the staff queue", () => {
    expect(canAccessRoute("submitter", "/queue")).toBe(false);
    expect(canAccessRoute("reviewer", "/queue")).toBe(true);
  });

  it("restricts analytics to managers", () => {
    expect(canAccessRoute("manager", "/analytics")).toBe(true);
    expect(canAccessRoute("reviewer", "/analytics")).toBe(false);
    expect(canAccessRoute("submitter", "/analytics")).toBe(false);
  });

  it("denies unknown routes", () => {
    expect(canAccessRoute("manager", "/admin/secrets")).toBe(false);
  });
});

describe("ticket ownership", () => {
  const ticket = makeTicket();

  it("lets the submitter see their own ticket", () => {
    expect(canViewTicket(makeUser("submitter", "u-submitter"), ticket)).toBe(true);
  });

  it("hides other submitters' tickets", () => {
    expect(canViewTicket(makeUser("submitter", "u-other"), ticket)).toBe(false);
  });

  it("lets reviewers see every ticket", () => {
    expect(canViewTicket(makeUser("reviewer"), ticket)).toBe(true);
  });

  it("denies a manager outside the organization/project scope", () => {
    const scopedTicket = makeTicket({ organizationId: "other-org", projectId: "other-project" });
    const manager = makeUser("manager");
    manager.organizationId = "helpdesk";
    manager.projectId = "helpdesk-core";
    expect(canViewTicket(manager, scopedTicket)).toBe(false);
    expect(canManageTicket(manager, scopedTicket, "ticket:status")).toBe(false);
  });

  it("blocks notes from a submitter who does not own the ticket", () => {
    expect(checkNote(makeUser("submitter", "u-other"), ticket)).toBeTruthy();
    expect(checkNote(makeUser("submitter", "u-submitter"), ticket)).toBeTruthy();
  });

  it("allows scoped managers and denies out-of-scope managers", () => {
    const manager = makeUser("manager");
    manager.organizationId = "helpdesk";
    manager.projectId = "helpdesk-core";
    expect(canManageTicket(manager, ticket, "ticket:status")).toBe(true);
    expect(canManageTicket(manager, { ...ticket, projectId: "other-project" }, "ticket:status")).toBe(false);
  });
});

describe("assignment", () => {
  it("allows managers to assign anyone", () => {
    const ticket = makeTicket({ status: "In Triage" });
    expect(checkAssignment(makeUser("manager"), ticket, "u-agent")).toBeNull();
  });

  it("blocks reviewer assignment", () => {
    expect(checkAssignment(makeUser("reviewer"), makeTicket(), "u-reviewer")).toBeTruthy();
  });

  it("blocks submitters and closed tickets", () => {
    expect(checkAssignment(makeUser("submitter"), makeTicket(), "u-agent")).toBeTruthy();
    expect(checkAssignment(makeUser("manager"), makeTicket({ status: "Closed" }), "u-agent")).toBeTruthy();
  });
});

describe("status transitions", () => {
  it("follows the lifecycle order", () => {
    const ticket = makeTicket({ status: "Open" });
    expect(checkStatusChange(makeUser("reviewer"), ticket, "In Triage")).toBeTruthy();
    expect(checkStatusChange(makeUser("manager"), ticket, "Resolved")).toBeTruthy();
  });

  it("refuses In Progress without an assignee", () => {
    const unassigned = makeTicket({ status: "In Triage", assigneeId: null });
    expect(checkStatusChange(makeUser("manager"), unassigned, "In Progress")).toMatch(/assignee/i);

    const assigned = makeTicket({ status: "In Triage", assigneeId: "u-agent" });
    expect(checkStatusChange(makeUser("manager"), assigned, "In Progress")).toBeNull();
  });

  it("enforces role permissions on transitions", () => {
    const ticket = makeTicket({ status: "In Progress", assigneeId: "u-agent" });
    expect(checkStatusChange(makeUser("manager"), ticket, "Resolved")).toBeNull();
    expect(checkStatusChange(makeUser("reviewer"), ticket, "Resolved")).toBeNull();
    expect(checkStatusChange(makeUser("submitter", "u-submitter"), ticket, "Resolved")).toBeTruthy();
  });

  it("keeps closed tickets read-only", () => {
    const closed = makeTicket({ status: "Closed", assigneeId: "u-agent" });
    for (const next of ["In Triage", "In Progress", "Resolved", "Closed"] as TicketStatus[]) {
      expect(checkStatusChange(makeUser("manager"), closed, next)).toBeTruthy();
    }
  });

  it("lets reviewers and managers close resolved tickets", () => {
    const resolved = makeTicket({ status: "Resolved", assigneeId: "u-agent" });
    expect(checkClose(makeUser("manager"), resolved)).toBeNull();
    expect(checkClose(makeUser("reviewer"), resolved)).toBeNull();
    expect(checkClose(makeUser("submitter", "u-submitter"), resolved)).toBeTruthy();
    expect(checkClose(makeUser("submitter", "u-other"), resolved)).toBeTruthy();
    expect(checkClose(makeUser("manager"), makeTicket({ status: "Open" }))).toBeTruthy();
  });
});
