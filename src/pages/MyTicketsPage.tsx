import { useMemo, useState } from "react";
import { TicketTable } from "../components/TicketTable";
import { useApp } from "../lib/store";
import type { TicketStatus } from "../lib/types";
import { LIFECYCLE } from "../lib/types";

export function MyTicketsPage() {
  const { user, tickets } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TicketStatus | "All">("All");

  const list = useMemo(() => {
    if (!user) return [];
    const scoped =
      user.role === "submitter"
        ? tickets.filter((t) => t.submitterId === user.id)
        : tickets.filter((t) => t.assigneeId === user.id || t.submitterId === user.id);
    return scoped.filter((ticket) => {
      const matchesStatus = status === "All" || ticket.status === status;
      const haystack = `${ticket.id} ${ticket.subject} ${ticket.category}`.toLowerCase();
      return matchesStatus && haystack.includes(query.trim().toLowerCase());
    });
  }, [query, status, tickets, user]);

  return (
    <div>
      <h1 className="text-4xl">My tickets</h1>
      <p className="mt-2" style={{ color: "var(--muted)" }}>
        Search and filter your requests. Closed tickets remain visible and read-only.
      </p>
      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          className="field md:max-w-sm"
          placeholder="Search ID, subject, category"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search tickets"
        />
        <select
          className="field md:max-w-[200px]"
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus | "All")}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          {LIFECYCLE.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-6">
        {list.length === 0 && !query && status === "All" ? (
          <div className="rounded-[12px] px-6 py-16 text-center" style={{ background: "var(--surface)" }}>
            <h2 className="text-2xl">No support requests yet.</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Create a ticket when something needs IT.
            </p>
          </div>
        ) : (
          <TicketTable tickets={list} />
        )}
      </div>
    </div>
  );
}
