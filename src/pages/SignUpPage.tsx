import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthField } from "../components/AuthField";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../lib/auth";
import { mapAuthError } from "../lib/authErrors";
import { PASSWORD_MIN_LENGTH, validateSignUp, type FieldErrors } from "../lib/validation";

export function SignUpPage() {
  const { user, mode, signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;
  if (mode === "demo") return <Navigate to="/signin" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateSignUp({ fullName, email, password, confirmPassword });
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await signUp({ fullName, email, password });
      navigate("/verify-email");
    } catch (error) {
      setFormError(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="New accounts start with the Submitter role">
      <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
        <AuthField
          id="fullName"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
        />
        <AuthField
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <AuthField
          id="password"
          label={`Password (min ${PASSWORD_MIN_LENGTH} characters)`}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <AuthField
          id="confirmPassword"
          label="Confirm password"
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
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link to="/signin" style={{ color: "var(--gold)" }}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
