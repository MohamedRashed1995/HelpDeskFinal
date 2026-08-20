import { useApp } from "../lib/store";
import { LIFECYCLE, type TicketStatus } from "../lib/types";

export function AnalyticsPage() {
  const { tickets, users } = useApp();
  const byStatus = Object.fromEntries(LIFECYCLE.map((status) => [status, tickets.filter((t) => t.status === status).length])) as Record<
    TicketStatus,
    number
  >;
  const maxStatus = Math.max(...Object.values(byStatus), 1);
  const byAssignee = tickets.reduce<Record<string, number>>((acc, ticket) => {
    const key = ticket.assigneeId ?? "unassigned";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-4xl">Analytics</h1>
      <p className="mt-2" style={{ color: "var(--muted)" }}>
        V1 operational counts only — no SLA, routing, or external-channel metrics.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-5">
        {LIFECYCLE.map((status) => (
          <div key={status} className="rounded-[12px] p-4" style={{ background: "var(--surface)" }}>
            <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
              {status}
            </div>
            <div className="mt-2 text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              {byStatus[status]}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[12px] p-6" style={{ background: "var(--surface)" }}>
          <h2 className="text-2xl">Queue distribution</h2>
          <ul className="mt-5 space-y-3">
            {LIFECYCLE.map((status) => (
              <li key={status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{status}</span>
                  <span>{byStatus[status]}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-high)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(byStatus[status] / maxStatus) * 100}%`,
                      background: "linear-gradient(90deg, var(--primary), var(--gold))",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[12px] p-6" style={{ background: "var(--surface)" }}>
          <h2 className="text-2xl">Tickets by assignee</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {Object.entries(byAssignee).map(([id, count]) => (
              <li key={id} className="flex justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <span>
                  {id === "unassigned" ? "Unassigned" : (users.find((item) => item.id === id)?.name ?? id)}
                </span>
                <span>{count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
