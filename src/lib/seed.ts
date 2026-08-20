import type { Ticket, User } from "./types";

type SeedTicket = Omit<Ticket, "priority" | "resolvedAt" | "closedAt"> &
  Partial<Pick<Ticket, "priority" | "resolvedAt" | "closedAt">>;

export const USERS: User[] = [
  {
    id: "u-marcus",
    name: "Mohamed Rashed",
    email: "Mohamed.webb@contoso.internal",
    role: "manager",
    title: "Support Manager",
  },
  {
    id: "u-priya",
    name: "Priya Shah",
    email: "priya.shah@contoso.internal",
    role: "reviewer",
    title: "Ticket Reviewer",
  },
  {
    id: "u-jordan",
    name: "Jordan Hale",
    email: "jordan.hale@contoso.internal",
    role: "reviewer",
    title: "Ticket Reviewer",
  },
  {
    id: "u-elena",
    name: "Elena Vargas",
    email: "elena.vargas@contoso.internal",
    role: "submitter",
    title: "People Operations",
  },
];

function act(
  id: string,
  at: string,
  userId: string,
  kind: Ticket["activity"][number]["kind"],
  message: string,
  from?: string,
  to?: string,
): Ticket["activity"][number] {
  return { id, at, userId, kind, message, from, to };
}

const RAW_SEED_TICKETS: SeedTicket[] = [
  {
    id: "HD-2408",
    subject: "VPN disconnects during standup",
    category: "Network",
    description:
      "GlobalProtect drops every 8–10 minutes on the office Wi-Fi. Reconnect works, but it interrupts calls.",
    status: "Open",
    submitterId: "u-elena",
    assigneeId: null,
    assignedById: null,
    assignedAt: null,
    createdAt: "2026-08-19T09:12:00.000Z",
    updatedAt: "2026-08-19T09:12:00.000Z",
    activity: [
      act("a1", "2026-08-19T09:12:00.000Z", "u-elena", "status", "Ticket opened", undefined, "Open"),
    ],
  },
  {
    id: "HD-2407",
    subject: "Need access to Finance shared drive",
    category: "Access & Accounts",
    description: "Starting Q3 close next week. Need read access to \\\\files\\finance\\close.",
    status: "In Triage",
    submitterId: "u-elena",
    assigneeId: null,
    assignedById: null,
    assignedAt: null,
    createdAt: "2026-08-18T14:40:00.000Z",
    updatedAt: "2026-08-19T08:05:00.000Z",
    activity: [
      act("a2", "2026-08-18T14:40:00.000Z", "u-elena", "status", "Ticket opened", undefined, "Open"),
      act("a3", "2026-08-19T08:05:00.000Z", "u-jordan", "status", "Moved into triage", "Open", "In Triage"),
      act("a4", "2026-08-19T08:06:00.000Z", "u-jordan", "note", "Confirming manager approval before assignment."),
    ],
  },
  {
    id: "HD-2406",
    subject: "Laptop fans at 100% after Windows update",
    category: "Hardware",
    description: "Surface Laptop 5 is loud and hot after last night's patch. Battery drains in ~90 minutes.",
    status: "In Progress",
    submitterId: "u-elena",
    assigneeId: "u-priya",
    assignedById: "u-jordan",
    assignedAt: "2026-08-18T11:20:00.000Z",
    createdAt: "2026-08-17T16:02:00.000Z",
    updatedAt: "2026-08-19T11:44:00.000Z",
    activity: [
      act("a5", "2026-08-17T16:02:00.000Z", "u-elena", "status", "Ticket opened", undefined, "Open"),
      act("a6", "2026-08-18T10:10:00.000Z", "u-jordan", "status", "Moved into triage", "Open", "In Triage"),
      act("a7", "2026-08-18T11:20:00.000Z", "u-jordan", "assignment", "Assigned to Priya Shah", undefined, "u-priya"),
      act("a8", "2026-08-18T11:21:00.000Z", "u-priya", "status", "Work started", "In Triage", "In Progress"),
      act("a9", "2026-08-19T11:44:00.000Z", "u-priya", "note", "Collecting thermal logs. Likely GPU driver after 24H2."),
    ],
  },
  {
    id: "HD-2405",
    subject: "Outlook signature missing company legal line",
    category: "Email",
    description: "New signature template dropped the confidentiality footer on desktop Outlook.",
    status: "Resolved",
    submitterId: "u-elena",
    assigneeId: "u-priya",
    assignedById: "u-marcus",
    assignedAt: "2026-08-15T09:00:00.000Z",
    createdAt: "2026-08-14T13:18:00.000Z",
    updatedAt: "2026-08-16T15:30:00.000Z",
    activity: [
      act("a10", "2026-08-14T13:18:00.000Z", "u-elena", "status", "Ticket opened", undefined, "Open"),
      act("a11", "2026-08-15T08:40:00.000Z", "u-jordan", "status", "Moved into triage", "Open", "In Triage"),
      act("a12", "2026-08-15T09:00:00.000Z", "u-marcus", "assignment", "Assigned to Priya Shah", undefined, "u-priya"),
      act("a13", "2026-08-15T09:05:00.000Z", "u-priya", "status", "Work started", "In Triage", "In Progress"),
      act("a14", "2026-08-16T15:30:00.000Z", "u-priya", "status", "Marked resolved", "In Progress", "Resolved"),
      act("a15", "2026-08-16T15:31:00.000Z", "u-priya", "note", "Pushed updated signature policy via Exchange."),
    ],
  },
  {
    id: "HD-2404",
    subject: "Replace mechanical keyboard (sticky spacebar)",
    category: "Hardware",
    description: "Spacebar double-fires. Asset tag LT-8841.",
    status: "Closed",
    submitterId: "u-elena",
    assigneeId: "u-priya",
    assignedById: "u-jordan",
    assignedAt: "2026-08-10T10:00:00.000Z",
    createdAt: "2026-08-09T11:00:00.000Z",
    updatedAt: "2026-08-12T17:00:00.000Z",
    activity: [
      act("a16", "2026-08-09T11:00:00.000Z", "u-elena", "status", "Ticket opened", undefined, "Open"),
      act("a17", "2026-08-10T09:30:00.000Z", "u-jordan", "status", "Moved into triage", "Open", "In Triage"),
      act("a18", "2026-08-10T10:00:00.000Z", "u-jordan", "assignment", "Assigned to Priya Shah", undefined, "u-priya"),
      act("a19", "2026-08-10T10:02:00.000Z", "u-priya", "status", "Work started", "In Triage", "In Progress"),
      act("a20", "2026-08-11T16:00:00.000Z", "u-priya", "status", "Marked resolved", "In Progress", "Resolved"),
      act("a21", "2026-08-12T17:00:00.000Z", "u-elena", "status", "Closed", "Resolved", "Closed"),
    ],
  },
  {
    id: "HD-2403",
    subject: "Cannot install Figma desktop on locked image",
    category: "Software",
    description: "AppLocker blocks Figma.exe. Design team needs the native client for plugins.",
    status: "In Progress",
    submitterId: "u-marcus",
    assigneeId: "u-priya",
    assignedById: "u-jordan",
    assignedAt: "2026-08-19T07:50:00.000Z",
    createdAt: "2026-08-18T18:22:00.000Z",
    updatedAt: "2026-08-20T01:10:00.000Z",
    activity: [
      act("a22", "2026-08-18T18:22:00.000Z", "u-marcus", "status", "Ticket opened", undefined, "Open"),
      act("a23", "2026-08-19T07:40:00.000Z", "u-jordan", "status", "Moved into triage", "Open", "In Triage"),
      act("a24", "2026-08-19T07:50:00.000Z", "u-jordan", "assignment", "Assigned to Priya Shah", undefined, "u-priya"),
      act("a25", "2026-08-19T07:51:00.000Z", "u-priya", "status", "Work started", "In Triage", "In Progress"),
    ],
  },
];

export const SEED_TICKETS: Ticket[] = RAW_SEED_TICKETS.map((ticket) => ({
  priority: "Normal",
  resolvedAt: ticket.status === "Resolved" || ticket.status === "Closed" ? ticket.updatedAt : null,
  closedAt: ticket.status === "Closed" ? ticket.updatedAt : null,
  ...ticket,
}));

export function userById(id: string) {
  return USERS.find((u) => u.id === id);
}
