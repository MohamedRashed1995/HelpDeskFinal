import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../lib/auth";
import { mapAuthError } from "../lib/authErrors";

export function VerifyEmailPage() {
  const { mode, user, emailVerified, confirmVerification, resendVerification, refreshVerification, signOutUser } =
    useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = params.get("oobCode") ?? "";

  const [applying, setApplying] = useState(Boolean(oobCode));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode === "demo" || !oobCode) return;
    let active = true;
    confirmVerification(oobCode)
      .then(() => {
        if (!active) return;
        setNotice("Email verified. You can continue to your workspace.");
        void refreshVerification();
      })
      .catch((cause) => {
        if (active) setError(mapAuthError(cause));
      })
      .finally(() => {
        if (active) setApplying(false);
      });
    return () => {
      active = false;
    };
  }, [confirmVerification, mode, oobCode, refreshVerification]);

  if (mode === "demo") return <Navigate to="/signin" replace />;
  if (!user && !oobCode) return <Navigate to="/signin" replace />;
  if (emailVerified && !oobCode) return <Navigate to="/" replace />;

  async function onResend() {
    setBusy(true);
    setError("");
    try {
      await resendVerification();
      setNotice("Verification email sent. Check your inbox.");
    } catch (cause) {
      setError(mapAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function onRefresh() {
    setBusy(true);
    setError("");
    try {
      const verified = await refreshVerification();
      if (verified) navigate("/");
      else setNotice("Still waiting on verification. Check your inbox, then try again.");
    } catch (cause) {
      setError(mapAuthError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={user ? `We sent a verification link to ${user.email}` : "Confirming your verification link"}
    >
      <div className="mt-8 space-y-5">
        {applying ? (
          <p className="text-sm" style={{ color: "var(--muted)" }} role="status">
            Applying your verification link…
          </p>
        ) : null}

        <p className="text-sm" style={{ color: "var(--muted)" }}>
          HelpDesk Lite needs a verified email before you can open the workspace. Once you have
          clicked the link, continue below.
        </p>

        {notice ? (
          <p className="text-sm" style={{ color: "var(--primary)" }} role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm" style={{ color: "var(--error)" }} role="alert">
            {error}
          </p>
        ) : null}

        {user ? (
          <div className="space-y-3">
            <button
              type="button"
              className="gold-btn w-full rounded-[8px] py-3 text-sm font-semibold disabled:opacity-60"
              onClick={onRefresh}
              disabled={busy}
            >
              {busy ? "Checking…" : "I have verified my email"}
            </button>
            <button
              type="button"
              className="w-full rounded-[8px] py-3 text-sm font-semibold disabled:opacity-60"
              style={{ border: "1px solid var(--border)" }}
              onClick={onResend}
              disabled={busy}
            >
              Resend verification email
            </button>
            <button
              type="button"
              className="w-full py-2 text-sm"
              style={{ color: "var(--muted)" }}
              onClick={() => void signOutUser()}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="gold-btn w-full rounded-[8px] py-3 text-sm font-semibold"
            onClick={() => navigate("/signin")}
          >
            Continue to sign in
          </button>
        )}
      </div>
    </AuthLayout>
  );
}
