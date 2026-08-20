import { Link } from "react-router-dom";
import type { Ticket } from "../lib/types";
import { useApp } from "../lib/store";
import { StatusBadge } from "./StatusBadge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const { users } = useApp();
  const assigneeName = (id: string | null) =>
    users.find((item) => item.id === id)?.name ?? "Unassigned";

  if (!tickets.length) {
    return (
      <div
        className="rounded-[12px] px-6 py-16 text-center"
        style={{ background: "var(--surface)" }}
      >
        <h2 className="text-2xl">No tickets match your filters.</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Try another status, assignee, or search term.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-[12px] md:block" style={{ background: "var(--surface)" }}>
        <table className="w-full text-left text-sm">
          <thead style={{ color: "var(--muted)" }}>
            <tr className="border-b text-[11px] uppercase tracking-[0.14em]" style={{ borderColor: "var(--border)" }}>
              <th className="px-4 py-3 font-semibold">Ticket</th>
              <th className="px-4 py-3 font-semibold">Subject</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Assignee</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-medium">
                  <Link to={`/tickets/${ticket.id}`} style={{ color: "var(--gold)" }}>
                    {ticket.id}
                  </Link>
                </td>
                <td className="px-4 py-3">{ticket.subject}</td>
                <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                  {ticket.category}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3">{assigneeName(ticket.assigneeId)}</td>
                <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                  {formatDate(ticket.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/tickets/${ticket.id}`}
            className="rounded-[12px] p-4"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold" style={{ color: "var(--gold)" }}>
                {ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="mt-2 font-medium">{ticket.subject}</div>
            <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {ticket.category} · {assigneeName(ticket.assigneeId)}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
