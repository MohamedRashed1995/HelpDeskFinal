import type { InputHTMLAttributes } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
};

export function AuthField({ id, label, error, ...input }: AuthFieldProps) {
  const errorId = `${id}-error`;
  return (
    <label className="block" htmlFor={id}>
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <input
        id={id}
        className="field mt-1"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...input}
      />
      {error ? (
        <p id={errorId} className="mt-2 text-sm" style={{ color: "var(--error)" }}>
          {error}
        </p>
      ) : null}
    </label>
  );
}
