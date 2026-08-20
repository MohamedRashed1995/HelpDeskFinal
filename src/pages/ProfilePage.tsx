import { useAuth } from "../lib/auth";
import { useApp } from "../lib/store";

export function ProfilePage() {
  const { user, theme, setTheme } = useApp();
  const { mode } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-xl">
      <h1 className="text-4xl">Profile</h1>
      <div className="mt-8 space-y-5 rounded-[12px] p-6" style={{ background: "var(--surface)" }}>
        <Field label="Name" value={user.name} />
        <Field label="Corporate email" value={user.email} />
        <Field label="Role" value={user.title} />
        <Field
          label="Authentication provider"
          value={mode === "firebase" ? "Firebase Authentication (email / password)" : "Local demo session"}
        />
        <Field label="Email verified" value={user.emailVerified ? "Yes" : "No"} />
      </div>
      <div className="mt-6 rounded-[12px] p-6" style={{ background: "var(--surface)" }}>
        <h2 className="text-2xl">Appearance</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Light and dark share the same layout. Only surfaces and accents change.
        </p>
        <div className="mt-4 flex gap-2">
          {(["dark", "light"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              className="rounded-[8px] px-4 py-2 text-sm font-semibold capitalize"
              style={{
                background: theme === mode ? "var(--surface-high)" : "transparent",
                color: theme === mode ? "var(--gold)" : "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="mt-1">{value}</div>
    </div>
  );
}
