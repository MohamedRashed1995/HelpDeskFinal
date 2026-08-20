import type { Role } from "./types";

export const ROLE_EMAILS = {
  manager: "manager@helpdesk.com",
  reviewer: "reviewer@helpdesk.com",
} as const;

export function roleForEmail(email: string | null | undefined): Role {
  const normalized = email?.trim().toLowerCase();
  if (normalized === ROLE_EMAILS.manager) return "manager";
  if (normalized === ROLE_EMAILS.reviewer) return "reviewer";
  return "submitter";
}