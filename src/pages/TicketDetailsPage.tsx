import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { canAssign, canChangeStatus } from "../lib/permissions";
import { useApp } from "../lib/store";
import { LIFECYCLE, NEXT_STATUS } from "../lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TicketDetailsPage() {
  const { id } = useParams();
  const { user, tickets, users, addNote, assignTicket, advanceStatus, closeTicket } = useApp();
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const [block, setBlock] = useState("");

  const ticket = tickets.find((item) => item.id === id);
  if (!ticket || !user) {
    return (
      <div>
        <h1 className="text-4xl">Ticket not found</h1>
        <Link to="/" className="mt-4 inline-block" style={{ color: "var(--gold)" }}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  const nameOf = (userId: string | null | undefined) =>
    users.find((item) => item.id === userId)?.name;

  const ticketId = ticket.id;
  const readonly = ticket.status === "Closed";
  const next = NEXT_STATUS[ticket.status];
  const reviewers = users.filter((item) => item.role === "reviewer" || item.role === "manager");
  const assignmentRequired = next === "In Progress" && !ticket.assigneeId;

  async function onNote(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setBlock((await addNote(ticketId, note.trim())) ?? "");
    setNote("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--gold)" }}>
          {ticket.id}
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="max-w-3xl text-4xl">{ticket.subject}</h1>
          <StatusBadge status={ticket.status} />
        </div>
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          {ticket.category} · Submitted by {nameOf(ticket.submitterId) ?? "Unknown"} ·{" "}
          {formatDate(ticket.createdAt)}
        </p>
        <div className="mt-8 rounded-[12px] p-6" style={{ background: "var(--surface)" }}>
          <h2 className="text-2xl">Description</h2>
          <p className="mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
            {ticket.description}
          </p>
        </div>

        <div className="mt-8 rounded-[12px] p-6" style={{ background: "var(--surface)" }}>
          <h2 className="text-2xl">Lifecycle</h2>
          <ol className="mt-5 flex flex-col gap-3">
            {LIFECYCLE.map((step, index) => {
              const currentIndex = LIFECYCLE.indexOf(ticket.status);
              const done = index < currentIndex;
              const current = index === currentIndex;
              return (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full text-xs"
                    style={{
                      background: current || done ? "var(--forest)" : "var(--surface-high)",
                      color: current ? "var(--gold)" : "var(--muted)",
                      border: current ? "1px solid var(--gold)" : "1px solid var(--border)",
                    }}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  <span style={{ color: current ? "var(--text)" : "var(--muted)" }}>{step}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 rounded-[12px] p-6" style={{ background: "var(--surface)" }}>
          <h2 className="text-2xl">Activity</h2>
          <ul className="mt-4 space-y-4">
            {ticket.activity.map((item) => (
              <li key={item.id} className="border-b pb-4 last:border-0" style={{ borderColor: "var(--border)" }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--gold-muted)" }}>
                  {item.kind === "note" ? "Note" : item.kind === "status" ? "Status change" : "Assignment"}
                </div>
                <p className="mt-1">{item.message}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {nameOf(item.userId) ?? "Unknown"} · {formatDate(item.at)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[12px] p-5" style={{ background: "var(--surface)" }}>
          <h2 className="text-xl">Assignment</h2>
          <p className="mt-2 text-sm">{nameOf(ticket.assigneeId) ?? "Unassigned"}</p>
          {ticket.assignedById ? (
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              Assigned by {nameOf(ticket.assignedById) ?? "Unknown"} ·{" "}
              {ticket.assignedAt ? formatDate(ticket.assignedAt) : ""}
            </p>
          ) : null}

          {!readonly && canAssign(user.role) ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!assignee) return;
                setBlock((await assignTicket(ticketId, assignee)) ?? "");
              }}
            >
              <label className="block text-sm">
                Assign reviewer
                <select className="field" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">Select</option>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="gold-btn w-full rounded-[8px] py-2 text-sm font-semibold">
                Assign
              </button>
            </form>
          ) : null}
        </div>

        {!readonly && canChangeStatus(user.role) ? (
          <div className="rounded-[12px] p-5" style={{ background: "var(--surface)" }}>
            <h2 className="text-xl">Actions</h2>
            {next ? (
              <button
                type="button"
                className="gold-btn mt-4 w-full rounded-[8px] py-2 text-sm font-semibold disabled:opacity-60"
                onClick={async () => setBlock((await advanceStatus(ticketId)) ?? "")}
                disabled={assignmentRequired}
                aria-describedby={assignmentRequired ? "assignee-required" : undefined}
              >
                Move to {next}
              </button>
            ) : null}
            {assignmentRequired ? (
              <p id="assignee-required" className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                Assign a reviewer before moving this ticket to In Progress.
              </p>
            ) : null}
            {ticket.status === "Resolved" && (user.role === "reviewer" || user.role === "manager") ? (
              <button
                type="button"
                className="mt-3 w-full rounded-[8px] py-2 text-sm font-semibold"
                style={{ border: "1px solid var(--border)" }}
                onClick={async () => setBlock((await closeTicket(ticketId)) ?? "")}
              >
                Close ticket
              </button>
            ) : null}
            {block ? (
              <p className="mt-3 text-sm" style={{ color: "var(--error)" }} role="alert">
                {block}
              </p>
            ) : null}
          </div>
        ) : readonly ? (
          <div className="rounded-[12px] p-5 text-sm" style={{ background: "var(--surface)", color: "var(--muted)" }}>
            This ticket is closed and cannot be edited.
          </div>
        ) : null}

        {!readonly && user.role !== "submitter" ? (
          <form className="rounded-[12px] p-5" style={{ background: "var(--surface)" }} onSubmit={onNote}>
            <h2 className="text-xl">Internal note</h2>
            <textarea className="field mt-3 min-h-24" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="submit" className="mt-3 text-sm font-semibold" style={{ color: "var(--gold)" }}>
              Add note
            </button>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
