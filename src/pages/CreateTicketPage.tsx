import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../lib/types";
import { useApp } from "../lib/store";

export function CreateTicketPage() {
  const { createTicket } = useApp();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!category) next.category = "Category is required.";
    if (!description.trim()) next.description = "Description is required.";
    if (description.trim().length > 2000) next.description = "Keep the description under 2,000 characters.";
    if (subject.trim().length > 120) next.subject = "Keep the subject under 120 characters.";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const ticket = await createTicket({
        subject: subject.trim() || description.trim().slice(0, 72),
        category,
        description: description.trim(),
      });
      setCreatedId(ticket.id);
      navigate(`/tickets/${ticket.id}`);
    } catch {
      setFormError("We could not create the ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--gold)" }}>
        Intake
      </p>
      <h1 className="mt-2 text-4xl">Create ticket</h1>
      <p className="mt-3" style={{ color: "var(--muted)" }}>
        Standardized request. Priority is a pending product decision and is not collected in V1.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6 rounded-[12px] p-6" style={{ background: "var(--surface)" }}>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
            Subject
          </span>
          <input
            className="field mt-1"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? "subject-error" : undefined}
          />
          {errors.subject ? (
            <p id="subject-error" className="mt-2 text-sm" style={{ color: "var(--error)" }}>
              {errors.subject}
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
            Category *
          </span>
          <select
            className="field mt-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? "category-error" : undefined}
            required
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p id="category-error" className="mt-2 text-sm" style={{ color: "var(--error)" }}>
              {errors.category}
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
            Description *
          </span>
          <textarea
            className="field mt-1 min-h-36 resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "desc-error" : undefined}
          />
          {errors.description ? (
            <p id="desc-error" className="mt-2 text-sm" style={{ color: "var(--error)" }}>
              {errors.description}
            </p>
          ) : null}
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Link to="/" className="px-4 py-2 text-sm" style={{ color: "var(--muted)" }}>
            Cancel
          </Link>
          <button
            type="submit"
            className="gold-btn rounded-[8px] px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit ticket"}
          </button>
        </div>
        {formError ? (
          <p className="text-sm" style={{ color: "var(--error)" }} role="alert">
            {formError}
          </p>
        ) : null}
      </form>
      {createdId ? (
        <p className="mt-4 text-sm">
          Created {createdId}. Current status: Open.
        </p>
      ) : null}
    </div>
  );
}
