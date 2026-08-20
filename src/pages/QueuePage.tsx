import { useMemo, useState } from "react";
import { TicketTable } from "../components/TicketTable";
import { useApp } from "../lib/store";
import { CATEGORIES, LIFECYCLE, type TicketStatus } from "../lib/types";

export function QueuePage() {
  const { user, tickets, users } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TicketStatus | "All">("All");
  const [category, setCategory] = useState("All");
  const [assignee, setAssignee] = useState("All");

  const title =
    user?.role === "agent" ? "My queue" : user?.role === "triage" ? "Triage queue" : "Manager queue";

  const list = useMemo(() => {
    if (!user) return [];
    let scoped = tickets;
    if (user.role === "agent") scoped = tickets.filter((t) => t.assigneeId === user.id);
    if (user.role === "triage") scoped = tickets.filter((t) => t.status === "Open" || t.status === "In Triage");
    return scoped.filter((ticket) => {
      const matchesStatus = status === "All" || ticket.status === status;
      const matchesCategory = category === "All" || ticket.category === category;
      const matchesAssignee =
        assignee === "All" ||
        (assignee === "unassigned" && !ticket.assigneeId) ||
        ticket.assigneeId === assignee;
      const haystack = `${ticket.id} ${ticket.subject} ${ticket.category}`.toLowerCase();
      return matchesStatus && matchesCategory && matchesAssignee && haystack.includes(query.trim().toLowerCase());
    });
  }, [assignee, category, query, status, tickets, user]);

  return (
    <div>
      <h1 className="text-4xl">{title}</h1>
      <p className="mt-2" style={{ color: "var(--muted)" }}>
        Filter the operational queue. Assignment stays explicit — In Progress cannot start without an assignee.
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <input
          className="field"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search queue"
        />
        <select className="field" value={status} onChange={(e) => setStatus(e.target.value as TicketStatus | "All")}>
          <option value="All">All statuses</option>
          {LIFECYCLE.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="field" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="All">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {users
            .filter((item) => item.role === "agent" || item.role === "manager")
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </div>
      {(status !== "All" || category !== "All" || assignee !== "All" || query) && (
        <button
          type="button"
          className="mt-3 text-sm"
          style={{ color: "var(--gold)" }}
          onClick={() => {
            setQuery("");
            setStatus("All");
            setCategory("All");
            setAssignee("All");
          }}
        >
          Clear filters
        </button>
      )}
      <div className="mt-6">
        <TicketTable tickets={list} />
      </div>
    </div>
  );
}
