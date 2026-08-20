import type { TicketStatus } from "../lib/types";

const STYLES: Record<TicketStatus, { mark: string; color: string }> = {
  Open: { mark: "○", color: "var(--primary)" },
  "In Triage": { mark: "◎", color: "var(--gold)" },
  "In Progress": { mark: "◐", color: "#dab36a" },
  Resolved: { mark: "✓", color: "var(--primary)" },
  Closed: { mark: "■", color: "var(--muted)" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const style = STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase"
      style={{
        background: "var(--surface-high)",
        color: style.color,
        border: "1px solid var(--border)",
      }}
    >
      <span aria-hidden>{style.mark}</span>
      {status}
    </span>
  );
}
