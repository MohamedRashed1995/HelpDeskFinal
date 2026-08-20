import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth";
import { checkAssignment, checkClose, checkNote, checkStatusChange, isStaff } from "./permissions";
import { SEED_TICKETS, USERS } from "./seed";
import * as repository from "./ticketsRepository";
import type { Ticket, TicketStatus, User } from "./types";
import { NEXT_STATUS } from "./types";

const STORAGE_KEY = "helpdesk-lite-state-v1";
const FIREBASE_FALLBACK_TICKETS_KEY = "helpdesk-lite-fallback-tickets-v1";

type Toast = { id: string; text: string } | null;

type AppContextValue = {
  user: User | null;
  users: User[];
  tickets: Ticket[];
  theme: "dark" | "light";
  toast: Toast;
  ticketsError: string;
  logout: () => void;
  setTheme: (theme: "dark" | "light") => void;
  createTicket: (input: {
    subject: string;
    category: string;
    description: string;
    priority?: Ticket["priority"];
  }) => Promise<Ticket>;
  addNote: (ticketId: string, message: string) => Promise<string | null>;
  assignTicket: (ticketId: string, assigneeId: string) => Promise<string | null>;
  advanceStatus: (ticketId: string) => Promise<string | null>;
  closeTicket: (ticketId: string) => Promise<string | null>;
};

const AppContext = createContext<AppContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function loadLocalState(): { tickets: Ticket[]; theme: "dark" | "light" } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tickets: SEED_TICKETS, theme: "dark" };
    const parsed = JSON.parse(raw) as { tickets?: Ticket[]; theme?: "dark" | "light" };
    return {
      tickets: parsed.tickets?.length ? parsed.tickets : SEED_TICKETS,
      theme: parsed.theme === "light" ? "light" : "dark",
    };
  } catch {
    return { tickets: SEED_TICKETS, theme: "dark" };
  }
}

function loadFallbackTickets(userId?: string): Ticket[] {
  try {
    const raw = localStorage.getItem(FIREBASE_FALLBACK_TICKETS_KEY);
    const tickets = raw ? (JSON.parse(raw) as Ticket[]) : [];
    return Array.isArray(tickets) ? tickets.filter((ticket) => !userId || ticket.submitterId === userId) : [];
  } catch {
    return [];
  }
}

function saveFallbackTicket(ticket: Ticket) {
  try {
    const existing = loadFallbackTickets();
    localStorage.setItem(
      FIREBASE_FALLBACK_TICKETS_KEY,
      JSON.stringify([...existing.filter((item) => item.id !== ticket.id), ticket]),
    );
  } catch (error) {
    console.error("[store] Could not persist fallback ticket to localStorage", { ticketId: ticket.id, error });
  }
}

function mergeTickets(remote: Ticket[], fallback: Ticket[]): Ticket[] {
  const byId = new Map(fallback.map((ticket) => [ticket.id, ticket]));
  remote.forEach((ticket) => byId.set(ticket.id, ticket));
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function fallbackTicketsForUser(user: User): Ticket[] {
  const local = loadFallbackTickets(isStaff(user.role) ? undefined : user.id);
  return isStaff(user.role) ? mergeTickets(local, SEED_TICKETS) : local;
}

function createLocalTicket(user: User, input: { subject: string; category: string; description: string; priority?: Ticket["priority"] }): Ticket {
  const createdAt = nowIso();
  return {
    id: `HD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
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
    activity: [{ id: crypto.randomUUID(), at: createdAt, userId: user.id, kind: "status", message: "Ticket opened", to: "Open" }],
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, mode, signOutUser } = useAuth();
  const initial = loadLocalState();
  const [tickets, setTickets] = useState<Ticket[]>(mode === "demo" ? initial.tickets : []);
  const [remoteUsers, setRemoteUsers] = useState<User[]>([]);
  const [theme, setThemeState] = useState<"dark" | "light">(initial.theme);
  const [toast, setToast] = useState<Toast>(null);
  const [ticketsError, setTicketsError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (mode !== "demo") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme }));
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tickets, theme }));
  }, [mode, tickets, theme]);

  useEffect(() => {
    if (mode !== "firebase" || !user) {
      if (mode === "firebase") setTickets([]);
      return;
    }
    setTicketsError("");
    setTickets(fallbackTicketsForUser(user));
    const unsubscribeTickets = repository.subscribeToTickets(
      user,
      (remoteTickets) =>
        setTickets((fallback) => {
          const local = loadFallbackTickets(isStaff(user.role) ? undefined : user.id);
          const fallbackTickets = remoteTickets.length
            ? [...fallback, ...local]
            : [...fallback, ...fallbackTicketsForUser(user)];
          return mergeTickets(remoteTickets, fallbackTickets);
        }),
      (error) => {
        console.error("[store] Firestore ticket subscription failed; using local fallback", error);
        setTickets(fallbackTicketsForUser(user));
        setTicketsError("");
      },
    );
    const unsubscribeUsers = repository.subscribeToUsers(setRemoteUsers, () => setRemoteUsers([]));
    return () => {
      unsubscribeTickets();
      unsubscribeUsers();
    };
  }, [mode, user]);

  const users = mode === "demo" ? USERS : remoteUsers;

  const showToast = useCallback((text: string) => {
    const id = crypto.randomUUID();
    setToast({ id, text });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2800);
  }, []);

  const logout = useCallback(() => {
    void signOutUser();
  }, [signOutUser]);

  const setTheme = useCallback((next: "dark" | "light") => {
    setThemeState(next);
  }, []);

  const patchLocal = useCallback((ticketId: string, patch: (ticket: Ticket) => Ticket) => {
    setTickets((list) => list.map((ticket) => (ticket.id === ticketId ? patch(ticket) : ticket)));
  }, []);

  const createTicket = useCallback<AppContextValue["createTicket"]>(
    async (input) => {
      if (!user) throw new Error("Not authenticated");
      if (mode === "firebase") {
        try {
          const created = await repository.createTicket(user, input);
          showToast("Ticket created successfully");
          return created;
        } catch (error) {
          console.error("[store] Firestore ticket creation failed; saving locally", error);
          const created = createLocalTicket(user, input);
          saveFallbackTicket(created);
          setTickets((list) => [created, ...list.filter((ticket) => ticket.id !== created.id)]);
          showToast("Ticket created locally");
          return created;
        }
      }

      const maxId = tickets.reduce((max, ticket) => {
        const n = Number(ticket.id.replace("HD-", ""));
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 2400);
      const created: Ticket = {
        id: `HD-${maxId + 1}`,
        subject: input.subject,
        category: input.category,
        description: input.description,
        status: "Open",
        priority: input.priority ?? "Normal",
        submitterId: user.id,
        assigneeId: null,
        assignedById: null,
        assignedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        resolvedAt: null,
        closedAt: null,
        activity: [
          {
            id: crypto.randomUUID(),
            at: nowIso(),
            userId: user.id,
            kind: "status",
            message: "Ticket opened",
            to: "Open",
          },
        ],
      };
      setTickets((list) => [created, ...list]);
      showToast("Ticket created successfully");
      return created;
    },
    [mode, showToast, tickets, user],
  );

  const addNote = useCallback<AppContextValue["addNote"]>(
    async (ticketId, message) => {
      const ticket = tickets.find((item) => item.id === ticketId);
      if (!user || !ticket) return "Ticket not found.";
      const blocked = checkNote(user, ticket);
      if (blocked) return blocked;

      if (mode === "firebase") {
        await repository.addNote(user, ticket, message);
      } else {
        patchLocal(ticketId, (current) => ({
          ...current,
          updatedAt: nowIso(),
          activity: [
            { id: crypto.randomUUID(), at: nowIso(), userId: user.id, kind: "note", message },
            ...current.activity,
          ],
        }));
      }
      showToast("Note added");
      return null;
    },
    [mode, patchLocal, showToast, tickets, user],
  );

  const assignTicket = useCallback<AppContextValue["assignTicket"]>(
    async (ticketId, assigneeId) => {
      const ticket = tickets.find((item) => item.id === ticketId);
      if (!user || !ticket) return "Ticket not found.";
      const blocked = checkAssignment(user, ticket, assigneeId);
      if (blocked) return blocked;

      const assigneeName = users.find((item) => item.id === assigneeId)?.name ?? assigneeId;
      if (mode === "firebase") {
        await repository.assignTicket(user, ticket, assigneeId, assigneeName);
      } else {
        patchLocal(ticketId, (current) => ({
          ...current,
          assigneeId,
          assignedById: user.id,
          assignedAt: nowIso(),
          updatedAt: nowIso(),
          activity: [
            {
              id: crypto.randomUUID(),
              at: nowIso(),
              userId: user.id,
              kind: "assignment",
              message: `Assigned to ${assigneeName}`,
              from: current.assigneeId ?? undefined,
              to: assigneeId,
            },
            ...current.activity,
          ],
        }));
      }
      showToast("Ticket assigned successfully");
      return null;
    },
    [mode, patchLocal, showToast, tickets, user, users],
  );

  const applyStatus = useCallback(
    async (ticket: Ticket, next: TicketStatus, actor: User) => {
      if (mode === "firebase") {
        await repository.changeStatus(actor, ticket, next);
        return;
      }
      const at = nowIso();
      patchLocal(ticket.id, (current) => ({
        ...current,
        status: next,
        updatedAt: at,
        resolvedAt: next === "Resolved" ? at : current.resolvedAt,
        closedAt: next === "Closed" ? at : current.closedAt,
        activity: [
          {
            id: crypto.randomUUID(),
            at,
            userId: actor.id,
            kind: "status",
            message: `Status updated to ${next}`,
            from: current.status,
            to: next,
          },
          ...current.activity,
        ],
      }));
    },
    [mode, patchLocal],
  );

  const advanceStatus = useCallback<AppContextValue["advanceStatus"]>(
    async (ticketId) => {
      const ticket = tickets.find((item) => item.id === ticketId);
      if (!user || !ticket) return "Ticket not found.";
      const next = NEXT_STATUS[ticket.status];
      if (!next) return "No further status change is allowed.";
      const blocked = checkStatusChange(user, ticket, next);
      if (blocked) return blocked;
      await applyStatus(ticket, next, user);
      showToast("Ticket status updated");
      return null;
    },
    [applyStatus, showToast, tickets, user],
  );

  const closeTicket = useCallback<AppContextValue["closeTicket"]>(
    async (ticketId) => {
      const ticket = tickets.find((item) => item.id === ticketId);
      if (!user || !ticket) return "Ticket not found.";
      const blocked = checkClose(user, ticket);
      if (blocked) return blocked;
      await applyStatus(ticket, "Closed", user);
      showToast("Ticket closed");
      return null;
    },
    [applyStatus, showToast, tickets, user],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      users,
      tickets,
      theme,
      toast,
      ticketsError,
      logout,
      setTheme,
      createTicket,
      addNote,
      assignTicket,
      advanceStatus,
      closeTicket,
    }),
    [
      addNote,
      advanceStatus,
      assignTicket,
      closeTicket,
      createTicket,
      logout,
      setTheme,
      theme,
      ticketsError,
      tickets,
      toast,
      user,
      users,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
