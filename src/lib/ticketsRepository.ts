import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import { assertCanManageTicket, checkStatusChange, hasPermission, ROLE_TITLES, isRole, isStaff } from "./permissions";
import { SEED_TICKETS } from "./seed";
import { DEFAULT_SCOPE } from "./roleConfig";
import type { Activity, AuditAction, Role, Ticket, TicketPriority, TicketStatus, User } from "./types";

function nowIso() {
  return new Date().toISOString();
}

function newTicketId() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HD-${suffix}`;
}

function activity(user: User, kind: Activity["kind"], message: string, from?: string, to?: string): Activity {
  return { id: crypto.randomUUID(), at: nowIso(), userId: user.id, kind, message, from, to };
}

function toTicket(id: string, data: Record<string, unknown>): Ticket {
  return {
    id,
    subject: String(data.subject ?? ""),
    category: String(data.category ?? "Other"),
    description: String(data.description ?? ""),
    status: (data.status ?? "Open") as TicketStatus,
    priority: (data.priority ?? "Normal") as Ticket["priority"],
    submitterId: String(data.submitterId ?? ""),
    assigneeId: (data.assigneeId as string | null) ?? null,
    assignedById: (data.assignedById as string | null) ?? null,
    assignedAt: (data.assignedAt as string | null) ?? null,
    createdAt: String(data.createdAt ?? nowIso()),
    updatedAt: String(data.updatedAt ?? nowIso()),
    resolvedAt: (data.resolvedAt as string | null) ?? null,
    closedAt: (data.closedAt as string | null) ?? null,
    activity: Array.isArray(data.activity) ? ([...data.activity] as Activity[]) : [],
    organizationId: String(data.organizationId ?? DEFAULT_SCOPE.organizationId),
    projectId: String(data.projectId ?? DEFAULT_SCOPE.projectId),
  };
}

function sortActivity(ticket: Ticket): Ticket {
  return { ...ticket, activity: [...ticket.activity].sort((a, b) => b.at.localeCompare(a.at)) };
}

/** Submitters only ever query their own tickets; staff read the whole desk. */
export function subscribeToTickets(
  user: User,
  onData: (tickets: Ticket[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const { db } = getFirebase();
  const tickets = collection(db, "tickets");
  const organizationId = user.organizationId ?? DEFAULT_SCOPE.organizationId;
  const projectId = user.projectId ?? DEFAULT_SCOPE.projectId;
  const scoped = isStaff(user.role)
    ? query(
        tickets,
        where("organizationId", "==", organizationId),
        where("projectId", "==", projectId),
        orderBy("updatedAt", "desc"),
      )
    : query(
        tickets,
        where("organizationId", "==", organizationId),
        where("projectId", "==", projectId),
        where("submitterId", "==", user.id),
      );

  return onSnapshot(
    scoped,
    (snapshot) => {
      const list = snapshot.docs
        .map((entry) => sortActivity(toTicket(entry.id, entry.data())))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onData(list.length === 0 && isStaff(user.role) ? SEED_TICKETS : list);
    },
    (error) => onError?.(error),
  );
}

export function subscribeToUsers(
  onData: (users: User[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const { db } = getFirebase();
  return onSnapshot(
    collection(db, "users"),
    (snapshot) => {
      onData(
        snapshot.docs.map((entry) => {
          const data = entry.data();
          const role: Role = isRole(data.role) ? data.role : "submitter";
          return {
            id: entry.id,
            name: String(data.displayName ?? data.email ?? ""),
            email: String(data.email ?? ""),
            role,
            title: ROLE_TITLES[role],
            emailVerified: data.emailVerified === true,
            authProvider: "firebase" as const,
            avatarUrl: (data.avatarUrl as string | null) ?? null,
            organizationId: String(data.organizationId ?? DEFAULT_SCOPE.organizationId),
            projectId: String(data.projectId ?? DEFAULT_SCOPE.projectId),
            active: data.active !== false,
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

type AuditInput = {
  ticketId: string;
  actorId: string;
  action: AuditAction;
  oldValue: string | null;
  newValue: string | null;
  organizationId?: string;
  projectId?: string;
};

function auditRef(input: AuditInput) {
  const { db } = getFirebase();
  const ref = doc(collection(db, "auditLogs"));
  return {
    ref,
    payload: {
      id: ref.id,
      createdAt: nowIso(),
      organizationId: input.organizationId ?? DEFAULT_SCOPE.organizationId,
      projectId: input.projectId ?? DEFAULT_SCOPE.projectId,
      ...input,
    },
  };
}

async function commit(
  ticketId: string,
  ticketUpdate: Record<string, unknown>,
  audits: AuditInput[],
) {
  const { db } = getFirebase();
  const batch = writeBatch(db);
  batch.update(doc(db, "tickets", ticketId), ticketUpdate);
  for (const entry of audits) {
    const { ref, payload } = auditRef(entry);
    batch.set(ref, payload);
  }
  await batch.commit();
}

export async function createTicket(
  user: User,
  input: { subject: string; category: string; description: string; priority?: Ticket["priority"] },
): Promise<Ticket> {
  if (!hasPermission(user.role, "ticket:create")) throw new Error("Forbidden: you cannot create tickets.");
  const { db } = getFirebase();
  const id = newTicketId();
  const createdAt = nowIso();
  const ticket: Ticket = {
    id,
    subject: input.subject,
    category: input.category,
    description: input.description,
    status: "Open",
    priority: input.priority ?? "Normal",
    submitterId: user.id,
    assigneeId: null,
    assignedById: null,
    assignedAt: null,
    createdAt,
    updatedAt: createdAt,
    resolvedAt: null,
    closedAt: null,
    activity: [activity(user, "status", "Ticket opened", undefined, "Open")],
    organizationId: user.organizationId ?? DEFAULT_SCOPE.organizationId,
    projectId: user.projectId ?? DEFAULT_SCOPE.projectId,
  };

  const batch = writeBatch(db);
  batch.set(doc(db, "tickets", id), ticket);
  const { ref, payload } = auditRef({
    ticketId: id,
    actorId: user.id,
    action: "ticket.created",
    oldValue: null,
    newValue: "Open",
    organizationId: ticket.organizationId,
    projectId: ticket.projectId,
  });
  batch.set(ref, payload);
  try {
    await batch.commit();
  } catch (error) {
    console.error("[ticketsRepository] Failed to create ticket in Firestore", {
      ticketId: id,
      userId: user.id,
      error,
    });
    throw error;
  }

  return ticket;
}

export async function addNote(user: User, ticket: Ticket, message: string) {
  assertCanManageTicket(user, ticket, "ticket:edit");
  await commit(
    ticket.id,
    { updatedAt: nowIso(), activity: arrayUnion(activity(user, "note", message)) },
    [
      {
        ticketId: ticket.id,
        actorId: user.id,
        action: "ticket.note",
        oldValue: null,
        newValue: message.slice(0, 500),
        organizationId: ticket.organizationId,
        projectId: ticket.projectId,
      },
    ],
  );
}

export async function assignTicket(user: User, ticket: Ticket, assigneeId: string, assigneeName: string) {
  assertCanManageTicket(user, ticket, "ticket:assign");
  const at = nowIso();
  await commit(
    ticket.id,
    {
      assigneeId,
      assignedById: user.id,
      assignedAt: at,
      updatedAt: at,
      activity: arrayUnion(
        activity(user, "assignment", `Assigned to ${assigneeName}`, ticket.assigneeId ?? undefined, assigneeId),
      ),
    },
    [
      {
        ticketId: ticket.id,
        actorId: user.id,
        action: "ticket.assigned",
        oldValue: ticket.assigneeId,
        newValue: assigneeId,
        organizationId: ticket.organizationId,
        projectId: ticket.projectId,
      },
    ],
  );
}

export async function changeStatus(user: User, ticket: Ticket, next: TicketStatus) {
  assertCanManageTicket(user, ticket, "ticket:status");
  const at = nowIso();
  const update: Record<string, unknown> = {
    status: next,
    updatedAt: at,
    activity: arrayUnion(activity(user, "status", `Status updated to ${next}`, ticket.status, next)),
  };
  if (next === "Resolved") update.resolvedAt = at;
  if (next === "Closed") update.closedAt = at;

  const action: AuditAction =
    next === "Resolved" ? "ticket.resolved" : next === "Closed" ? "ticket.closed" : "ticket.status";

  await commit(ticket.id, update, [
    {
      ticketId: ticket.id,
      actorId: user.id,
      action,
      oldValue: ticket.status,
      newValue: next,
      organizationId: ticket.organizationId,
      projectId: ticket.projectId,
    },
  ]);
}

export async function changePriority(user: User, ticket: Ticket, priority: TicketPriority) {
  assertCanManageTicket(user, ticket, "ticket:priority");
  if (ticket.status === "Closed") throw new Error("Closed tickets are read-only.");
  await commit(
    ticket.id,
    { priority, updatedAt: nowIso(), activity: arrayUnion(activity(user, "status", `Priority updated to ${priority}`)) },
    [{
      ticketId: ticket.id,
      actorId: user.id,
      action: "ticket.priority",
      oldValue: ticket.priority,
      newValue: priority,
      organizationId: ticket.organizationId,
      projectId: ticket.projectId,
    }],
  );
}

export async function bulkChangeStatus(user: User, tickets: Ticket[], next: TicketStatus) {
  if (!hasPermission(user.role, "ticket:bulk")) throw new Error("Forbidden: bulk actions require manager permission.");
  const { db } = getFirebase();
  const batch = writeBatch(db);
  const at = nowIso();
  for (const ticket of tickets) {
    assertCanManageTicket(user, ticket, "ticket:status");
    const blocked = checkStatusChange(user, ticket, next);
    if (blocked) throw new Error(blocked);
    const update: Record<string, unknown> = {
      status: next,
      updatedAt: at,
      activity: arrayUnion(activity(user, "status", `Bulk status updated to ${next}`, ticket.status, next)),
    };
    if (next === "Resolved") update.resolvedAt = at;
    if (next === "Closed") update.closedAt = at;
    batch.update(doc(db, "tickets", ticket.id), update);
    const { ref, payload } = auditRef({
      ticketId: ticket.id,
      actorId: user.id,
      action: "ticket.bulk",
      oldValue: ticket.status,
      newValue: next,
      organizationId: ticket.organizationId,
      projectId: ticket.projectId,
    });
    batch.set(ref, payload);
  }
  await batch.commit();
}
