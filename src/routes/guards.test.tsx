import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Role, User } from "../lib/types";
import { PublicOnly, RequireAuth, RoleGate } from "./guards";

const state: { loading: boolean; user: User | null; emailVerified: boolean } = {
  loading: false,
  user: null,
  emailVerified: false,
};

vi.mock("../lib/auth", () => ({
  useAuth: () => state,
}));

function setAuth(next: Partial<typeof state>) {
  Object.assign(state, { loading: false, user: null, emailVerified: false }, next);
}

function makeUser(role: Role): User {
  return {
    id: `u-${role}`,
    name: role,
    email: `${role}@acme.com`,
    role,
    title: role,
    emailVerified: true,
    authProvider: "firebase",
    avatarUrl: null,
  };
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/signin" element={<h1>Sign in</h1>} />
          <Route path="/verify-email" element={<h1>Verify your email</h1>} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/tickets" element={<h1>My tickets</h1>} />
          <Route element={<RoleGate allow={["reviewer", "manager"]} />}>
            <Route path="/queue" element={<h1>Queue</h1>} />
          </Route>
          <Route element={<RoleGate allow={["manager"]} />}>
            <Route path="/analytics" element={<h1>Analytics</h1>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe("auth state", () => {
  it("shows a loading state while authentication resolves", () => {
    setAuth({ loading: true });
    renderAt("/tickets");
    expect(screen.getByRole("status")).toBeDefined();
  });
});

describe("protected routes", () => {
  it("redirects anonymous visitors to sign in", () => {
    setAuth({});
    renderAt("/tickets");
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeDefined();
  });

  it("allows authenticated users to continue before email verification", () => {
    setAuth({ user: makeUser("submitter"), emailVerified: false });
    renderAt("/tickets");
    expect(screen.getByRole("heading", { name: "My tickets" })).toBeDefined();
  });

  it("renders the route for a verified user", () => {
    setAuth({ user: makeUser("submitter"), emailVerified: true });
    renderAt("/tickets");
    expect(screen.getByRole("heading", { name: "My tickets" })).toBeDefined();
  });
});

describe("unauthorized access", () => {
  it("shows a 403 page instead of the staff queue for submitters", () => {
    setAuth({ user: makeUser("submitter"), emailVerified: true });
    renderAt("/queue");
    expect(screen.getByRole("heading", { name: /access denied/i })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Queue" })).toBeNull();
  });

  it("shows a 403 page instead of analytics for reviewers", () => {
    setAuth({ user: makeUser("reviewer"), emailVerified: true });
    renderAt("/analytics");
    expect(screen.getByRole("heading", { name: /access denied/i })).toBeDefined();
  });

  it("lets staff into the queue and managers into analytics", () => {
    setAuth({ user: makeUser("reviewer"), emailVerified: true });
    renderAt("/queue");
    expect(screen.getByRole("heading", { name: "Queue" })).toBeDefined();
    cleanup();

    setAuth({ user: makeUser("manager"), emailVerified: true });
    renderAt("/analytics");
    expect(screen.getByRole("heading", { name: "Analytics" })).toBeDefined();
  });
});
