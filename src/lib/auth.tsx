import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyActionCode,
  browserLocalPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebase, isFirebaseConfigured } from "./firebase";
import { DEFAULT_ROLE, ROLE_TITLES } from "./permissions";
import { roleForEmail } from "./roleConfig";
import { USERS, userById } from "./seed";
import type { User, UserProfileDoc } from "./types";

const DEMO_SESSION_KEY = "helpdesk-lite-demo-user";

type AuthContextValue = {
  loading: boolean;
  mode: "firebase" | "demo";
  firebaseUser: FirebaseUser | null;
  user: User | null;
  role: User["role"] | null;
  emailVerified: boolean;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOutUser: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  confirmVerification: (oobCode: string) => Promise<void>;
  verifyResetCode: (oobCode: string) => Promise<string>;
  completeReset: (oobCode: string, password: string) => Promise<void>;
  refreshVerification: () => Promise<boolean>;
  demoLogin: (userId: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function profileToUser(profile: UserProfileDoc, authenticatedEmail: string | null): User {
  const email = authenticatedEmail ?? profile.email;
  const role = roleForEmail(email);
  return {
    id: profile.uid,
    name: profile.displayName || profile.email,
    email,
    role,
    title: ROLE_TITLES[role],
    emailVerified: profile.emailVerified,
    authProvider: "firebase",
    avatarUrl: profile.avatarUrl ?? null,
  };
}

function firebaseUserToUser(firebaseUser: FirebaseUser): User {
  const role = roleForEmail(firebaseUser.email);
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName ?? firebaseUser.email ?? "",
    email: firebaseUser.email ?? "",
    role,
    title: ROLE_TITLES[role],
    emailVerified: firebaseUser.emailVerified,
    authProvider: "firebase",
    avatarUrl: firebaseUser.photoURL,
  };
}

function readProfileDoc(uid: string, data: Record<string, unknown> | undefined): UserProfileDoc | null {
  if (!data) return null;
  const email = typeof data.email === "string" ? data.email : "";
  return {
    uid,
    email,
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    role: roleForEmail(email),
    emailVerified: data.emailVerified === true,
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "",
  };
}

/**
 * Creates `users/{uid}` on first sign-in and keeps `emailVerified` in sync.
 * The role is never taken from client input — new accounts use the configured email mapping.
 */
async function ensureProfile(firebaseUser: FirebaseUser) {
  const { db } = getFirebase();
  const ref = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(ref);
  const now = new Date().toISOString();

  if (!snapshot.exists()) {
    const profile: UserProfileDoc = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName ?? firebaseUser.email ?? "",
      role: roleForEmail(firebaseUser.email),
      emailVerified: firebaseUser.emailVerified,
      avatarUrl: firebaseUser.photoURL,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, { ...profile, createdAtServer: serverTimestamp() });
    return;
  }

  if (snapshot.data().emailVerified !== firebaseUser.emailVerified) {
    await setDoc(ref, { emailVerified: firebaseUser.emailVerified, updatedAt: now }, { merge: true });
  }

  const configuredRole = roleForEmail(firebaseUser.email);
  if (configuredRole !== DEFAULT_ROLE && snapshot.data().role !== configuredRole) {
    await setDoc(ref, { role: configuredRole, updatedAt: now }, { merge: true });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode = isFirebaseConfigured ? "firebase" : "demo";
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [demoUser, setDemoUser] = useState<User | null>(null);
  const [verificationTick, setVerificationTick] = useState(0);

  useEffect(() => {
    if (mode === "demo") {
      const storedId = localStorage.getItem(DEMO_SESSION_KEY);
      setDemoUser(storedId ? (userById(storedId) ?? null) : null);
      setLoading(false);
      return;
    }

    const { auth } = getFirebase();
    void setPersistence(auth, browserLocalPersistence);

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      setFirebaseUser(nextUser);
      setProfile(null);

      if (!nextUser) {
        setLoading(false);
        return;
      }

      try {
        await ensureProfile(nextUser);
      } catch {
        // A missing/locked profile still resolves auth state; the UI shows the signed-in shell.
      }

      const { db } = getFirebase();
      unsubscribeProfile = onSnapshot(
        doc(db, "users", nextUser.uid),
        (snapshot) => {
          setProfile(readProfileDoc(nextUser.uid, snapshot.data()));
          setLoading(false);
        },
        () => setLoading(false),
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribe();
    };
  }, [mode]);

  const demoLogin = useCallback((userId: string) => {
    const next = userById(userId);
    if (!next) return;
    localStorage.setItem(DEMO_SESSION_KEY, userId);
    setDemoUser({ ...next, authProvider: "demo", emailVerified: true });
  }, []);

  const signUp = useCallback(
    async ({ fullName, email, password }: { fullName: string; email: string; password: string }) => {
      const { auth } = getFirebase();
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      await ensureProfile(credential.user);
      await sendEmailVerification(credential.user);
    },
    [],
  );

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { auth } = getFirebase();
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOutUser = useCallback(async () => {
    if (mode === "demo") {
      localStorage.removeItem(DEMO_SESSION_KEY);
      setDemoUser(null);
      return;
    }
    const { auth } = getFirebase();
    await signOut(auth);
  }, [mode]);

  const sendReset = useCallback(async (email: string) => {
    const { auth } = getFirebase();
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const resendVerification = useCallback(async () => {
    const { auth } = getFirebase();
    if (!auth.currentUser) throw new Error("Not authenticated");
    await sendEmailVerification(auth.currentUser);
  }, []);

  const confirmVerification = useCallback(async (oobCode: string) => {
    const { auth } = getFirebase();
    await applyActionCode(auth, oobCode);
    await auth.currentUser?.reload();
  }, []);

  const verifyResetCode = useCallback(async (oobCode: string) => {
    const { auth } = getFirebase();
    return verifyPasswordResetCode(auth, oobCode);
  }, []);

  const completeReset = useCallback(async (oobCode: string, password: string) => {
    const { auth } = getFirebase();
    await confirmPasswordReset(auth, oobCode, password);
  }, []);

  const refreshVerification = useCallback(async () => {
    const { auth } = getFirebase();
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    if (verified) await ensureProfile(auth.currentUser);
    setVerificationTick((tick) => tick + 1);
    return verified;
  }, []);

  const user = useMemo(() => {
    void verificationTick;
    if (mode === "demo") return demoUser;
    if (!firebaseUser) return null;
    if (profile) return { ...profileToUser(profile, firebaseUser.email), emailVerified: firebaseUser.emailVerified };
    return firebaseUserToUser(firebaseUser);
  }, [demoUser, firebaseUser, mode, profile, verificationTick]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      mode,
      firebaseUser,
      user,
      role: user?.role ?? null,
      emailVerified: mode === "demo" ? true : Boolean(user?.emailVerified),
      signUp,
      signIn,
      signOutUser,
      sendReset,
      resendVerification,
      confirmVerification,
      verifyResetCode,
      completeReset,
      refreshVerification,
      demoLogin,
    }),
    [
      completeReset,
      confirmVerification,
      demoLogin,
      firebaseUser,
      loading,
      mode,
      refreshVerification,
      resendVerification,
      sendReset,
      signIn,
      signOutUser,
      signUp,
      user,
      verifyResetCode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const DEMO_PERSONAS = USERS;
