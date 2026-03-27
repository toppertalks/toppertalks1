/**
 * TopperTalks — Extended Auth helpers
 * Google sign-in + Email/Password sign-in (both free on Firebase Spark plan)
 */
"use client";

import {
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
    User,
    onAuthStateChanged,
    signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ── Google Sign-In ────────────────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    const result = await signInWithPopup(auth, provider);
    return result.user;
}

// ── Email / Password ──────────────────────────────────────────────────────────
export async function signUpWithEmail(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function sendPasswordReset(email: string) {
    await sendPasswordResetEmail(auth, email);
}

// ── Phone OTP (requires Blaze plan) ──────────────────────────────────────────
export function setupRecaptcha(buttonId: string): RecaptchaVerifier {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).recaptchaVerifier) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).recaptchaVerifier.clear();
    }
    const verifier = new RecaptchaVerifier(auth, buttonId, { size: "invisible", callback: () => { } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).recaptchaVerifier = verifier;
    return verifier;
}

export async function sendOTP(phoneNumber: string): Promise<ConfirmationResult> {
    const verifier = setupRecaptcha("send-otp-btn");
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function verifyOTP(confirmation: ConfirmationResult, otp: string): Promise<User> {
    const result = await confirmation.confirm(otp);
    return result.user;
}

// ── Profile management ────────────────────────────────────────────────────────
export async function saveUserProfile(user: User, profile: {
    name: string;
    role: "student" | "topper";
    examMode?: "JEE" | "NEET";
}) {
    const ref = doc(db, "users", user.uid);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
        await setDoc(ref, {
            uid: user.uid,
            email: user.email ?? null,
            phone: user.phoneNumber ?? null,
            photoURL: user.photoURL ?? null,
            name: profile.name,
            role: profile.role,
            examMode: profile.examMode ?? "JEE",
            walletBalance: 0,
            createdAt: serverTimestamp(),
        });
    } else {
        await setDoc(ref, { name: profile.name, role: profile.role, updatedAt: serverTimestamp() }, { merge: true });
    }
}

export async function getUserProfile(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
}

export async function signOut() {
    await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
    return auth.currentUser;
}
