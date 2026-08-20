import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { Role } from "../lib/types";
import { ForbiddenPage } from "../pages/ForbiddenPage";

export function AuthLoading() {
  return (
    <div
      className="grid min-h-screen place-items-center"
      style={{ background: "var(--bg)" }}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Loading your workspace…
      </p>
    </div>
  );
}

/** Signed-in users only; email verification is optional and does not block access. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function PublicOnly() {
  const { loading } = useAuth();
  if (loading) return <AuthLoading />;
  return <Outlet />;
}

export function RoleGate({ allow }: { allow: Role[] }) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) return <ForbiddenPage />;
  return <Outlet />;
}
