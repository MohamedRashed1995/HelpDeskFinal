import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function ForbiddenPage() {
  const { user } = useAuth();
  return (
    <div role="alert">
      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--gold)" }}>
        403
      </p>
      <h1 className="mt-2 text-4xl">Access denied</h1>
      <p className="mt-3 max-w-xl" style={{ color: "var(--muted)" }}>
        This area is not available to the {user?.title ?? "current"} role. Firestore security rules
        enforce the same boundary, so the data stays protected even outside the UI.
      </p>
      <Link to="/" className="mt-6 inline-block text-sm font-semibold" style={{ color: "var(--gold)" }}>
        Back to dashboard
      </Link>
    </div>
  );
}
