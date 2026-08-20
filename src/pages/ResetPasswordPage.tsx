import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AuthField } from "../components/AuthField";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../lib/auth";
import { mapAuthError } from "../lib/authErrors";
import { PASSWORD_MIN_LENGTH, validateNewPassword, type FieldErrors } from "../lib/validation";

export function ResetPasswordPage() {
  const { mode, verifyResetCode, completeReset } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = params.get("oobCode") ?? "";
  const actionMode = params.get("mode");

  const [checking, setChecking] = useState(Boolean(oobCode));
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "demo" || !oobCode || actionMode === "verifyEmail") return;
    let active = true;
    verifyResetCode(oobCode)
      .then((email) => {
        if (active) setAccount(email);
      })
      .catch((error) => {
        if (active) setFormError(mapAuthError(error));
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [actionMode, mode, oobCode, verifyResetCode]);

  if (mode === "demo") return <Navigate to="/signin" replace />;
  if (actionMode === "verifyEmail" && oobCode) {
    return <Navigate to={`/verify-email?oobCode=${encodeURIComponent(oobCode)}`} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateNewPassword({ password, confirmPassword });
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await completeReset(oobCode, password);
      setDone(true);
      window.setTimeout(() => navigate("/signin"), 1500);
    } catch (error) {
      setFormError(mapAuthError(error));
    } finally {
      setSaving(false);
    }
  }

  if (!oobCode) {
    return (
      <AuthLayout title="Reset password" subtitle="This page needs a valid reset link">
        <div className="mt-8 space-y-4">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Open the reset link from your email, or request a new one.
          </p>
          <Link to="/forgot-password" className="text-sm" style={{ color: "var(--gold)" }}>
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle={account ? `Resetting the password for ${account}` : "Verifying your reset link"}
    >
      {checking ? (
        <p className="mt-8 text-sm" style={{ color: "var(--muted)" }} role="status">
          Checking your link…
        </p>
      ) : done ? (
        <p className="mt-8 text-sm" style={{ color: "var(--primary)" }} role="status">
          Password updated. Redirecting to sign in…
        </p>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
          <AuthField
            id="password"
            label={`New password (min ${PASSWORD_MIN_LENGTH} characters)`}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
          />
          <AuthField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={errors.confirmPassword}
          />

          {formError ? (
            <p className="text-sm" style={{ color: "var(--error)" }} role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            className="gold-btn w-full rounded-[8px] py-3 text-sm font-semibold disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Updating password…" : "Update password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
