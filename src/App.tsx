import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AuthProvider } from "./lib/auth";
import { AppProvider } from "./lib/store";
import { PublicOnly, RequireAuth, RoleGate } from "./routes/guards";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CreateTicketPage } from "./pages/CreateTicketPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { QueuePage } from "./pages/QueuePage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { TicketDetailsPage } from "./pages/TicketDetailsPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicOnly />}>
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/login" element={<Navigate to="/signin" replace />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/tickets" element={<MyTicketsPage />} />
                <Route path="/tickets/new" element={<CreateTicketPage />} />
                <Route path="/tickets/:id" element={<TicketDetailsPage />} />
                <Route element={<RoleGate allow={["agent", "triage", "manager"]} />}>
                  <Route path="/queue" element={<QueuePage />} />
                  <Route path="/agent/queue" element={<Navigate to="/queue" replace />} />
                </Route>
                <Route element={<RoleGate allow={["manager"]} />}>
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/manager/queue" element={<Navigate to="/queue" replace />} />
                </Route>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<Navigate to="/profile" replace />} />
                <Route
                  path="*"
                  element={
                    <div>
                      <h1 className="text-4xl">Page not found</h1>
                      <p className="mt-3" style={{ color: "var(--muted)" }}>
                        That route is not part of HelpDesk Lite V1.
                      </p>
                    </div>
                  }
                />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
