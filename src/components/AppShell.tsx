import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { useApp } from "../lib/store";
import type { Role } from "../lib/types";

const NAV: Record<
  Role,
  { to: string; label: string; icon: typeof Inbox }[]
> = {
  submitter: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/tickets", label: "My Tickets", icon: Ticket },
    { to: "/tickets/new", label: "Create Ticket", icon: Plus },
    { to: "/profile", label: "Profile", icon: UserRound },
  ],
  reviewer: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/queue", label: "Review Queue", icon: Inbox },
    { to: "/profile", label: "Profile", icon: UserRound },
  ],
  manager: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/queue", label: "Queue", icon: Inbox },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/profile", label: "Profile", icon: UserRound },
  ],
};

export function AppShell() {
  const { user, logout, toast } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  if (!user) return null;
  const items = NAV[user.role];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex min-h-screen">
        <aside
          className="hidden w-[240px] shrink-0 flex-col border-r md:flex"
          style={{
            background: "var(--surface-lowest)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-3 px-5 py-6">
            <Logo />
            <div>
              <div className="text-sm font-semibold tracking-wide">HelpDesk Lite</div>
              <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                Internal
              </div>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm ${
                    isActive ? "font-semibold" : ""
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--surface-high)" : "transparent",
                  color: isActive ? "var(--gold)" : "var(--text)",
                })}
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setConfirmOut(true)}
            className="m-4 flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-left text-sm"
            style={{ color: "var(--muted)" }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex items-center justify-between gap-3 border-b px-4 py-3 md:px-8"
            style={{
              background: "color-mix(in srgb, var(--surface-low) 80%, transparent)",
              borderColor: "var(--border)",
            }}
          >
            <button
              type="button"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden text-sm md:block" style={{ color: "var(--muted)" }}>
              Welcome back, {user.name.split(" ")[0]}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--gold-muted)" }}>
                  {user.role.toUpperCase()}
                </div>
              </div>
              <div
                className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold"
                style={{ background: "var(--forest)", color: "var(--gold)" }}
              >
                {user.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col p-4"
            style={{ background: "var(--surface-lowest)" }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size={32} />
                <span className="font-semibold">HelpDesk Lite</span>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-[6px] px-3 py-3"
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}

      {confirmOut ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
          <div
            className="w-full max-w-md rounded-[12px] p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            role="dialog"
            aria-labelledby="logout-title"
          >
            <h2 id="logout-title" className="text-[28px]">
              Sign out?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              You will need to sign in again to return to the workspace.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="px-4 py-2 text-sm" onClick={() => setConfirmOut(false)}>
                Stay
              </button>
              <button
                type="button"
                className="gold-btn rounded-[6px] px-4 py-2 text-sm font-semibold"
                onClick={() => {
                  logout();
                  navigate("/signin");
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-[8px] px-4 py-3 text-sm shadow-none"
          style={{
            background: "var(--surface-high)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          role="status"
        >
          {toast.text}
        </div>
      ) : null}
    </div>
  );
}
