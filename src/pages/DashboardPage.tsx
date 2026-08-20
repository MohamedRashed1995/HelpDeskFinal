import { Link } from "react-router-dom";
import { TicketTable } from "../components/TicketTable";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../lib/store";
import type { TicketStatus } from "../lib/types";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[12px] p-5" style={{ background: "var(--surface)" }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="mt-3 font-[family-name:var(--font-display)] text-4xl">{value}</div>
    </div>
  );
}

export function DashboardPage() {
  const { user, tickets } = useApp();
  if (!user) return null;

  const mine = tickets.filter((t) => t.submitterId === user.id);
  const count = (status: TicketStatus, list = tickets) =>
    list.filter((t) => t.status === status).length;

  if (user.role === "submitter") {
    return (
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--gold)" }}>
              Workspace
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl">Good to see you, {user.name.split(" ")[0]}.</h1>
            <p className="mt-3 max-w-xl" style={{ color: "var(--muted)" }}>
              Submit a request, then track it from Open through Closed — without chasing email threads.
            </p>
          </div>
          <Link to="/tickets/new" className="gold-btn rounded-[8px] px-5 py-3 text-sm font-semibold">
            Create ticket
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="My open" value={mine.filter((t) => t.status !== "Closed" && t.status !== "Resolved").length} />
          <Stat label="Resolved" value={count("Resolved", mine)} />
          <Stat label="Closed" value={count("Closed", mine)} />
        </div>
        <h2 className="mt-10 text-2xl">Recently updated</h2>
        <div className="mt-4">
          <TicketTable tickets={[...mine].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6)} />
        </div>
      </div>
    );
  }

  if (user.role === "reviewer") {
    return (
      <div>
        <h1 className="text-4xl md:text-5xl">Review queue</h1>
        <p className="mt-3" style={{ color: "var(--muted)" }}>
          Review all support requests. Ticket status changes are reserved for managers.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Stat label="Open" value={count("Open")} />
          <Stat label="In triage" value={count("In Triage")} />
        </div>
        <div className="mt-8">
          <TicketTable tickets={tickets} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl md:text-5xl">Operations</h1>
      <p className="mt-3" style={{ color: "var(--muted)" }}>
        Workload across the internal support desk. SLA timers are intentionally out of scope for V1.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(["Open", "In Triage", "In Progress", "Resolved", "Closed"] as TicketStatus[]).map((status) => (
          <Stat key={status} label={status} value={count(status)} />
        ))}
      </div>
      <h2 className="mt-10 text-2xl">Recent activity</h2>
      <ul className="mt-4 space-y-3">
        {tickets
          .flatMap((ticket) =>
            ticket.activity.slice(0, 1).map((item) => ({ ticket, item })),
          )
          .sort((a, b) => b.item.at.localeCompare(a.item.at))
          .slice(0, 6)
          .map(({ ticket, item }) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] px-4 py-3"
              style={{ background: "var(--surface)" }}
            >
              <div>
                <Link to={`/tickets/${ticket.id}`} className="font-medium" style={{ color: "var(--gold)" }}>
                  {ticket.id}
                </Link>
                <span className="ml-2 text-sm">{item.message}</span>
              </div>
              <StatusBadge status={ticket.status} />
            </li>
          ))}
      </ul>
    </div>
  );
}
