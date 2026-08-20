import type { ReactNode } from "react";
import { Logo } from "./Logo";

const ROLES = [
  { title: "Submitter", copy: "Submit and track support tickets" },
  { title: "Agent", copy: "Manage and resolve the queue" },
  { title: "Manager", copy: "Oversee workload and operations" },
];

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2" style={{ background: "var(--bg)" }}>
      <section
        className="relative hidden overflow-hidden px-12 py-14 lg:flex lg:flex-col"
        style={{
          background:
            "radial-gradient(1200px 600px at -10% 20%, var(--glow), transparent 50%), var(--surface-lowest)",
        }}
      >
        <div className="flex items-center gap-3">
          <Logo size={42} />
          <span className="text-lg font-semibold tracking-wide">HelpDesk Lite</span>
        </div>
        <div className="my-auto max-w-xl">
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--gold)" }}
          >
            IT support,
          </p>
          <h1 className="mt-3 text-6xl leading-[1.05]">resolved.</h1>
          <p className="mt-6 max-w-md text-lg" style={{ color: "var(--muted)" }}>
            Submit tickets, track progress, and get your team moving again — without the friction.
          </p>
          <div className="mt-12 grid gap-4">
            {ROLES.map((role) => (
              <div
                key={role.title}
                className="rounded-[10px] px-5 py-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="text-sm font-semibold">{role.title}</div>
                <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  {role.copy}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo />
            <span className="font-semibold">HelpDesk Lite</span>
          </div>
          <h1 className="text-5xl">{title}</h1>
          <p className="mt-3" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
          {children}
        </div>
      </section>
    </div>
  );
}
