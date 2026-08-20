import { describe, expect, it } from "vitest";
import { canManageTicket, checkAssignment, checkNote, checkStatusChange } from "./permissions";
import type { Ticket, User } from "./types";

const manager: User = {
  id: "manager-1",
  name: "Manager",
  email: "manager@helpdesk.com",
  role: "manager",
  title: "Support Manager",
  organizationId: "helpdesk",
  projectId: "helpdesk-core",
  active: true,
};
const reviewer: User = {
  id: "reviewer-1",
  name: "Reviewer One",
  email: "reviewer@company.local",
  role: "reviewer",
  title: "Ticket Reviewer",
  organizationId: "helpdesk",
  projectId: "helpdesk-core",
  active: true,
};
const submitter: User = {
  id: "submitter-1",
  name: "Submitter",
  email: "submitter@company.local",
  role: "submitter",
  title: "Submitter",
  organizationId: "helpdesk",
  projectId: "helpdesk-core",
  active: true,
};
const ticket: Ticket = {
  id: "HD-TEST",
  subject: "Test ticket",
  category: "Software",
  description: "Test",
  status: "Open",
  priority: "Normal",
  submitterId: submitter.id,
  assigneeId: null,
  assignedById: null,
  assignedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  resolvedAt: null,
  closedAt: null,
  activity: [],
  organizationId: "helpdesk",
  projectId: "helpdesk-core",
};

describe("ticket action authorization", () => {
  it("allows only managers to move an open ticket into triage", () => {
    expect(checkStatusChange(manager, ticket, "In Triage")).toBeNull();
    expect(checkStatusChange(reviewer, ticket, "In Triage")).toBeNull();
    expect(checkStatusChange(submitter, ticket, "In Triage")).toMatch(/reviewers|managers/i);
  });

  it("allows scoped internal notes only for reviewers and managers", () => {
    expect(checkNote(manager, ticket)).toBeNull();
    expect(checkNote(reviewer, ticket)).toBeNull();
    expect(checkNote(submitter, ticket)).toMatch(/role|comment|note/i);
  });

  it("validates active reviewer assignment and scope", () => {
    expect(checkAssignment(manager, ticket, reviewer.id, reviewer)).toBeNull();
    expect(checkAssignment(manager, ticket, reviewer.id, { ...reviewer, active: false })).toMatch(/active/i);
    expect(checkAssignment(submitter, ticket, reviewer.id, reviewer)).toMatch(/permission|assignment/i);
    expect(canManageTicket(manager, { ...ticket, organizationId: "other-org" }, "ticket:assign")).toBe(false);
  });
});
