import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthField } from "../components/AuthField";
import { AuthLayout } from "../components/AuthLayout";
import { DEMO_PERSONAS, useAuth } from "../lib/auth";
import { mapAuthError } from "../lib/authErrors";
import { validateSignIn, type FieldErrors } from "../lib/validation";

export function SignInPage() {
  const { user, mode, signIn, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateSignIn({ email, password });
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await signIn({ email, password });
      navigate("/");
    } catch (error) {
      setFormError(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to HelpDesk Lite">
      {mode === "firebase" ? (
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
          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
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
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" style={{ color: "var(--gold)" }}>
              Forgot password?
            </Link>
            <Link to="/signup" style={{ color: "var(--gold)" }}>
              Create an account
            </Link>
          </div>
        </form>
      ) : (
        <div className="mt-8 space-y-3">
          <div
            className="rounded-[8px] px-4 py-3 text-sm"
            style={{ background: "var(--forest)", color: "var(--primary)" }}
          >
            Demo environment
            <div className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
              Firebase is not configured, so HelpDesk Lite is running on local demo data. Set the
              VITE_FIREBASE_* environment variables to enable real accounts.
            </div>
          </div>
          {DEMO_PERSONAS.map((persona) => (
            <button
              key={persona.id}
              type="button"
              onClick={() => {
                demoLogin(persona.id);
                navigate("/");
              }}
              className="flex w-full items-center justify-between rounded-[10px] px-4 py-3 text-left"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span>
                <span className="block text-sm font-semibold">{persona.name}</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {persona.title}
                </span>
              </span>
              <span className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--gold)" }}>
                Enter
              </span>
            </button>
          ))}
        </div>
      )}
    </AuthLayout>
  );
}
