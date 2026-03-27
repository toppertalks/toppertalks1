/**
 * TopperTalks — Firestore database helpers
 * All reads/writes to Firestore go through here
 */
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc,
    addDoc, query, where, orderBy, limit, serverTimestamp,
    increment, onSnapshot, Unsubscribe, Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
    uid: string;
    phone: string;
    name: string;
    role: "student" | "topper";
    examMode: "JEE" | "NEET";
    walletBalance: number;
    createdAt: Timestamp;
}

export interface TopperProfile {
    uid: string;
    name: string;
    college: string;
    tag: "IIT" | "NIT" | "AIIMS" | string;
    exam: string;
    rank: string;
    subjects: string[];
    bio: string;
    rating: number;
    totalSessions: number;
    isOnline: boolean;
    isVerified: boolean;
    avatarUrl: string;
    walletBalance: number;
    pendingPayout: number;
}

export interface Session {
    id: string;
    studentId: string;
    topperId: string;
    studentName: string;
    topperName: string;
    startedAt: Timestamp;
    endedAt?: Timestamp;
    durationSeconds: number;
    amountCharged: number;
    topperEarned: number;
    platformFee: number;
    status: "active" | "completed" | "reported";
    reportReason?: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function getUser(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateWalletBalance(uid: string, delta: number) {
    await updateDoc(doc(db, "users", uid), {
        walletBalance: increment(delta),
        updatedAt: serverTimestamp(),
    });
}

// ─── Toppers ──────────────────────────────────────────────────────────────────
export async function getToppers(examFilter?: "JEE" | "NEET"): Promise<TopperProfile[]> {
    let q = query(
        collection(db, "toppers"),
        where("isVerified", "==", true),
        orderBy("rating", "desc"),
        limit(20)
    );
    if (examFilter) {
        q = query(
            collection(db, "toppers"),
            where("isVerified", "==", true),
            where("examMode", "==", examFilter),
            orderBy("rating", "desc"),
            limit(20)
        );
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as TopperProfile));
}

export async function getTopper(uid: string): Promise<TopperProfile | null> {
    const snap = await getDoc(doc(db, "toppers", uid));
    return snap.exists() ? (snap.data() as TopperProfile) : null;
}

export async function setTopperOnlineStatus(uid: string, isOnline: boolean) {
    await updateDoc(doc(db, "toppers", uid), {
        isOnline,
        lastSeen: serverTimestamp(),
    });
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export async function createSession(data: Omit<Session, "id" | "startedAt">): Promise<string> {
    const ref = await addDoc(collection(db, "sessions"), {
        ...data,
        startedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function completeSession(sessionId: string, data: {
    durationSeconds: number;
    amountCharged: number;
    topperEarned: number;
    platformFee: number;
}) {
    await updateDoc(doc(db, "sessions", sessionId), {
        ...data,
        status: "completed",
        endedAt: serverTimestamp(),
    });
}

export async function reportSession(sessionId: string, reason: string, reportedBy: string) {
    await updateDoc(doc(db, "sessions", sessionId), {
        status: "reported",
        reportReason: reason,
        reportedBy,
        reportedAt: serverTimestamp(),
        paymentHeldUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    });
}

export async function getStudentSessions(studentId: string): Promise<Session[]> {
    const q = query(
        collection(db, "sessions"),
        where("studentId", "==", studentId),
        orderBy("startedAt", "desc"),
        limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Session));
}

export async function getTopperSessions(topperId: string): Promise<Session[]> {
    const q = query(
        collection(db, "sessions"),
        where("topperId", "==", topperId),
        orderBy("startedAt", "desc"),
        limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Session));
}

// ─── Ratings ──────────────────────────────────────────────────────────────────
export async function submitRating(data: {
    sessionId: string;
    fromId: string;
    toId: string;
    stars: number;
    comment: string;
    fromRole: "student" | "topper";
}) {
    // Save rating
    await addDoc(collection(db, "ratings"), {
        ...data,
        createdAt: serverTimestamp(),
    });

    // Recalculate topper's average rating (simplified — in production use Cloud Function)
    const ratingsSnap = await getDocs(
        query(collection(db, "ratings"), where("toId", "==", data.toId))
    );
    const ratings = ratingsSnap.docs.map(d => d.data().stars as number);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    await updateDoc(doc(db, "toppers", data.toId), {
        rating: Math.round(avg * 10) / 10,
        totalSessions: increment(1),
    });
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function saveNotification(uid: string, notif: {
    type: "call" | "payment" | "rating" | "system";
    title: string;
    body: string;
}) {
    await addDoc(collection(db, "users", uid, "notifications"), {
        ...notif,
        read: false,
        createdAt: serverTimestamp(),
    });
}

export function listenToNotifications(uid: string, callback: (notifs: any[]) => void): Unsubscribe {
    const q = query(
        collection(db, "users", uid, "notifications"),
        orderBy("createdAt", "desc"),
        limit(30)
    );
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}

// ─── Mentor Applications ──────────────────────────────────────────────────────
export async function submitMentorApplication(data: {
    uid: string;
    name: string;
    phone: string;
    college: string;
    exams: { exam: string; rank: string }[];
    subjects: string[];
    bio: string;
}) {
    await setDoc(doc(db, "mentorApplications", data.uid), {
        ...data,
        status: "pending",
        submittedAt: serverTimestamp(),
    });
}
