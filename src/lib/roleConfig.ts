import type { Role } from "./types";

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