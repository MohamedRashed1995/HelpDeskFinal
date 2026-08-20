import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROLE,
  canAccessRoute,
  canViewTicket,
  checkAssignment,
  checkClose,
  checkNote,
  checkStatusChange,
  isStaff,
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
    ...overrides,
  };
}

describe("roles", () => {
  it("defaults new accounts to submitter", () => {
    expect(DEFAULT_ROLE).toBe("submitter");
  });

  it("treats agent, triage and manager as staff", () => {
    expect(isStaff("agent")).toBe(true);
    expect(isStaff("triage")).toBe(true);
    expect(isStaff("manager")).toBe(true);
    expect(isStaff("submitter")).toBe(false);
  });
});

describe("route permissions", () => {
  it("lets any signed-in role reach shared routes", () => {
    for (const role of ["submitter", "agent", "triage", "manager"] as Role[]) {
      expect(canAccessRoute(role, "/")).toBe(true);
      expect(canAccessRoute(role, "/tickets")).toBe(true);
    }
  });

  it("keeps submitters out of the staff queue", () => {
    expect(canAccessRoute("submitter", "/queue")).toBe(false);
    expect(canAccessRoute("agent", "/queue")).toBe(true);
  });

  it("restricts analytics to managers", () => {
    expect(canAccessRoute("manager", "/analytics")).toBe(true);
    expect(canAccessRoute("triage", "/analytics")).toBe(false);
    expect(canAccessRoute("agent", "/analytics")).toBe(false);
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

  it("lets staff see every ticket", () => {
    expect(canViewTicket(makeUser("agent"), ticket)).toBe(true);
  });

  it("blocks notes from a submitter who does not own the ticket", () => {
    expect(checkNote(makeUser("submitter", "u-other"), ticket)).toBeTruthy();
    expect(checkNote(makeUser("submitter", "u-submitter"), ticket)).toBeNull();
  });
});

describe("assignment", () => {
  it("allows triage and managers to assign anyone", () => {
    const ticket = makeTicket({ status: "In Triage" });
    expect(checkAssignment(makeUser("triage"), ticket, "u-agent")).toBeNull();
    expect(checkAssignment(makeUser("manager"), ticket, "u-agent")).toBeNull();
  });

  it("limits agents to self-assignment", () => {
    const ticket = makeTicket({ status: "In Triage" });
    const agent = makeUser("agent");
    expect(checkAssignment(agent, ticket, agent.id)).toBeNull();
    expect(checkAssignment(agent, ticket, "someone-else")).toBeTruthy();
  });

  it("blocks submitters and closed tickets", () => {
    expect(checkAssignment(makeUser("submitter"), makeTicket(), "u-agent")).toBeTruthy();
    expect(checkAssignment(makeUser("manager"), makeTicket({ status: "Closed" }), "u-agent")).toBeTruthy();
  });
});

describe("status transitions", () => {
  it("follows the lifecycle order", () => {
    const ticket = makeTicket({ status: "Open" });
    expect(checkStatusChange(makeUser("triage"), ticket, "In Triage")).toBeTruthy();
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
    expect(checkStatusChange(makeUser("agent"), ticket, "Resolved")).toBeNull();
    expect(checkStatusChange(makeUser("submitter", "u-submitter"), ticket, "Resolved")).toBeTruthy();
  });

  it("keeps closed tickets read-only", () => {
    const closed = makeTicket({ status: "Closed", assigneeId: "u-agent" });
    for (const next of ["In Triage", "In Progress", "Resolved", "Closed"] as TicketStatus[]) {
      expect(checkStatusChange(makeUser("manager"), closed, next)).toBeTruthy();
    }
  });

  it("only lets managers close resolved tickets", () => {
    const resolved = makeTicket({ status: "Resolved", assigneeId: "u-agent" });
    expect(checkClose(makeUser("manager"), resolved)).toBeNull();
    expect(checkClose(makeUser("submitter", "u-submitter"), resolved)).toBeTruthy();
    expect(checkClose(makeUser("submitter", "u-other"), resolved)).toBeTruthy();
    expect(checkClose(makeUser("agent"), resolved)).toBeTruthy();
    expect(checkClose(makeUser("manager"), makeTicket({ status: "Open" }))).toBeTruthy();
  });
});
