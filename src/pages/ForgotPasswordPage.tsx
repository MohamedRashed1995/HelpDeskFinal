import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthField } from "../components/AuthField";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../lib/auth";
import { PASSWORD_RESET_NOTICE, mapAuthError } from "../lib/authErrors";
import { validateEmailOnly, type FieldErrors } from "../lib/validation";

export function ForgotPasswordPage() {
  const { mode, sendReset } = useAuth();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (mode === "demo") return <Navigate to="/signin" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateEmailOnly(email);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await sendReset(email);
      setNotice(PASSWORD_RESET_NOTICE);
    } catch (error) {
      // Account existence is never revealed, so only infrastructure errors surface here.
      const code = (error as { code?: string })?.code;
      if (code === "auth/user-not-found") setNotice(PASSWORD_RESET_NOTICE);
      else setFormError(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="We will email you a secure reset link">
      <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
        <AuthField
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />

        {notice ? (
          <p className="text-sm" style={{ color: "var(--primary)" }} role="status">
            {notice}
          </p>
        ) : null}
        {formError ? (
          <p className="text-sm" style={{ color: "var(--error)" }} role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          className="gold-btn w-full rounded-[8px] py-3 text-sm font-semibold disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Sending link…" : "Send reset link"}
        </button>

        <Link to="/signin" className="block text-sm" style={{ color: "var(--gold)" }}>
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
