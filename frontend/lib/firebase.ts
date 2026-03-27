/**
 * TopperTalks — Firebase configuration
 * Replace the placeholder values below with YOUR Firebase project credentials
 * from https://console.firebase.google.com → Project Settings → Your apps → Web app
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// ── Paste YOUR Firebase config here ──────────────────────────────────────────
// Go to: console.firebase.google.com → select project → ⚙️ Settings → General
// Scroll to "Your apps" → select web app → copy firebaseConfig object
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "REPLACE_WITH_YOUR_API_KEY",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "REPLACE.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "REPLACE_WITH_PROJECT_ID",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "REPLACE.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "REPLACE",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "REPLACE_WITH_APP_ID",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-REPLACE",
};
// ──────────────────────────────────────────────────────────────────────────────

// Singleton pattern — safe to call multiple times (Next.js hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only in browser
export const analytics = typeof window !== "undefined"
    ? isSupported().then(yes => yes ? getAnalytics(app) : null)
    : Promise.resolve(null);

export default app;
