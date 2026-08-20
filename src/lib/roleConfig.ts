import { DEFAULT_ORGANIZATION_ID, DEFAULT_PROJECT_ID, type Permission, type Role } from "./types";

export const ROLE_EMAILS: { manager: readonly string[]; reviewer: readonly string[] } = {
  manager: ["manager@helpdesk.com", "mohamed.webb@contoso.internal"],
  reviewer: ["reviewer@helpdesk.com"],
} as const;

export function roleForEmail(email: string | null | undefined): Role {
  const normalized = email?.trim().toLowerCase();
  if (normalized && ROLE_EMAILS.manager.includes(normalized)) return "manager";
  if (normalized && ROLE_EMAILS.reviewer.includes(normalized)) return "reviewer";
  return "submitter";
}

export function roleForProfile(email: string | null | undefined, storedRole: unknown): Role {
  const configured = roleForEmail(email);
  if (configured !== "submitter") return configured;
  return storedRole === "reviewer" || storedRole === "manager" ? storedRole : "submitter";
}

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  submitter: ["ticket:view:own", "ticket:create"],
  reviewer: ["ticket:view:scope", "ticket:status", "ticket:edit"],
  manager: [
    "ticket:view:scope",
    "ticket:create",
    "ticket:edit",
    "ticket:status",
    "ticket:priority",
    "ticket:assign",
    "ticket:bulk",
    "metrics:view",
    "audit:view",
    "ticket:export",
  ],
};

export const DEFAULT_SCOPE = {
  organizationId: DEFAULT_ORGANIZATION_ID,
  projectId: DEFAULT_PROJECT_ID,
} as const;