import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const required = [
  "FIREBASE_PROJECT_ID",
  "SEED_REVIEWER_1_EMAIL",
  "SEED_REVIEWER_1_PASSWORD",
  "SEED_REVIEWER_1_NAME",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing required seed variables: ${missing.join(", ")}`);
}

const reviewers = [
  {
    email: process.env.SEED_REVIEWER_1_EMAIL,
    password: process.env.SEED_REVIEWER_1_PASSWORD,
    displayName: process.env.SEED_REVIEWER_1_NAME,
  },
];

if (process.env.SEED_REVIEWER_2_EMAIL && process.env.SEED_REVIEWER_2_PASSWORD && process.env.SEED_REVIEWER_2_NAME) {
  reviewers.push({
    email: process.env.SEED_REVIEWER_2_EMAIL,
    password: process.env.SEED_REVIEWER_2_PASSWORD,
    displayName: process.env.SEED_REVIEWER_2_NAME,
  });
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const auth = getAuth();
const db = getFirestore();
const organizationId = process.env.SEED_ORGANIZATION_ID ?? "helpdesk";
const projectId = process.env.SEED_PROJECT_ID ?? "helpdesk-core";

for (const reviewer of reviewers) {
  const email = reviewer.email.trim().toLowerCase();
  let account;
  try {
    account = await auth.getUserByEmail(email);
    account = await auth.updateUser(account.uid, {
      email,
      displayName: reviewer.displayName,
      password: reviewer.password,
      disabled: false,
    });
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    account = await auth.createUser({
      email,
      password: reviewer.password,
      displayName: reviewer.displayName,
      disabled: false,
    });
  }

  await db.collection("users").doc(account.uid).set(
    {
      uid: account.uid,
      email,
      displayName: reviewer.displayName,
      role: "reviewer",
      active: true,
      organizationId,
      projectId,
      emailVerified: account.emailVerified,
      updatedAt: new Date().toISOString(),
      createdAtServer: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`Provisioned reviewer ${email} (${account.uid})`);
}

console.log("Reviewer provisioning complete.");
