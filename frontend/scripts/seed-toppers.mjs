/**
 * TopperTalks — Firestore Seed Script
 * Run this ONCE to populate the `toppers` collection with initial data.
 *
 * HOW TO RUN:
 *   1. Make sure your .env.local has all NEXT_PUBLIC_FIREBASE_* variables set
 *   2. From the frontend folder run:   node scripts/seed-toppers.mjs
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";

// Load .env.local manually (Node doesn't load it automatically)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env.local");
try {
    const envContent = readFileSync(envPath, "utf8");
    envContent.split("\n").forEach(line => {
        const [key, ...val] = line.split("=");
        if (key && val.length) process.env[key.trim()] = val.join("=").trim();
    });
    console.log("✅ Loaded .env.local");
} catch {
    console.log("⚠️  No .env.local found — make sure env vars are set");
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── The 8 toppers shown on the home page ────────────────────────────────────
const TOPPERS = [
    {
        id: "topper_001",
        name: "Ananya Sharma",
        college: "IIT Bombay",
        tag: "IIT",
        exam: "JEE",
        rank: "AIR 234",
        subjects: ["Physics", "Maths"],
        bio: "Hey! I cracked JEE Advanced with AIR 234. I love breaking down tough concepts into simple steps. Physics and Maths are my strong suits — especially Mechanics and Calculus.",
        rating: 4.9,
        totalSessions: 312,
        isOnline: false,
        isVerified: true,
        ratePerMinute: 10,
        avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
        walletBalance: 0,
        pendingPayout: 0,
    },
    {
        id: "topper_002",
        name: "Rohan Mehta",
        college: "AIIMS Delhi",
        tag: "AIIMS",
        exam: "NEET",
        rank: "AIR 87",
        subjects: ["Biology", "Chemistry"],
        bio: "AIIMS Delhi student with AIR 87 in NEET. I specialize in Biology — from Cell Biology to Human Physiology. Let me help you ace NEET!",
        rating: 4.8,
        totalSessions: 189,
        isOnline: false,
        isVerified: true,
        ratePerMinute: 10,
        avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
        walletBalance: 0,
        pendingPayout: 0,
    },
    {
        id: "topper_003",
        name: "Priya Krishnan",
        college: "IIT Delhi",
        tag: "IIT",
        exam: "JEE",
        rank: "AIR 156",
        subjects: ["Chemistry", "Maths"],
        bio: "IIT Delhi, Computer Science. JEE Advanced AIR 156. Organic Chemistry and Integration are my superpowers — I can make them feel easy for you.",
        rating: 4.95,
        totalSessions: 428,
        isOnline: false,
        isVerified: true,
        ratePerMinute: 10,
        avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
        walletBalance: 0,
        pendingPayout: 0,
    },
    {
        id: "topper_004",
        name: "Arjun Verma",
        college: "NIT Trichy",
        tag: "NIT",
        exam: "JEE",
        rank: "AIR 892",
        subjects: ["Maths", "Physics"],
        bio: "NIT Trichy, Mechanical. JEE Mains AIR 892. I know exactly what it feels like to study hard and crack it. Maths and Integration are my strength areas.",
        rating: 4.7,
        totalSessions: 201,
        isOnline: false,
        isVerified: true,
        ratePerMinute: 10,
        avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
        walletBalance: 0,
        pendingPayout: 0,
    },
    {
        id: "topper_005",
        name: "Meera Rao",
        college: "IIT Madras",
        tag: "IIT",
        exam: "JEE",
        rank: "AIR 312",
        subjects: ["Physics", "Mechanics"],
        bio: "IIT Madras, Physics. AIR 312 JEE Advanced. Rotational Mechanics, Waves, and Electrodynamics are the areas I love teaching most.",
        rating: 4.85,
        totalSessions: 376,
        isOnline: false,
        isVerified: true,
        ratePerMinute: 10,
        avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
        walletBalance: 0,
        pendingPayout: 0,
    },
    {
        id: "topper_006",
        name: "Karan Sharma",
        college: "NIT Surathkal",
        tag: "NIT",
        exam: "JEE",
        rank: "AIR 1,240",
        subjects: ["Maths", "Algebra"],
        bio: "NIT Surathkal student. JEE Main rank 1240. I'm patient and methodical — perfect if you want to build strong basics in Algebra and Coordinate Geometry.",
        rating: 4.78,
        totalSessions: 254,
        isOnline: false,
        isVerified: true,
        ratePerMinute: 10,
        avatarUrl: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg",
        walletBalance: 0,
        pendingPayout: 0,
    },
    {
        id: "topper_007",
        name: "Divya Pillai",
        college: "AIIMS Bhopal",
        tag: "AIIMS",
        exam: "NEET",
        rank: "AIR 312",
        subjects: ["Biology", "Botany"],
        bio: "AIIMS Bhopal. NEET AIR 312. Botany, Zoology, and Biochemistry are my go-to areas. I make sure every concept is crystal clear before moving forward.",
        rating: 4.82,
        totalSessions: 167,
        isOnline: false,
        isVerified: true,
        ratePerMinute: 10,
        avatarUrl: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg",
        walletBalance: 0,
        pendingPayout: 0,
    },
    {
        id: "topper_008",
        name: "Siddharth Anand",
        college: "IIT Kharagpur",
        tag: "IIT",
        exam: "JEE",
        rank: "AIR 567",
        subjects: ["Physics", "Electronics"],
        bio: "IIT Kharagpur, Electronics and Communication. JEE Advanced AIR 567. Semiconductors, Circuits, and Modern Physics — I can explain them all in a simple practical way.",
        rating: 4.75,
        totalSessions: 143,
        isOnline: false,
        isVerified: true,
        ratePerMinute: 10,
        avatarUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg",
        walletBalance: 0,
        pendingPayout: 0,
    },
];

// ── Write to Firestore ────────────────────────────────────────────────────────
async function seed() {
    console.log(`\n🌱 Seeding ${TOPPERS.length} toppers to Firestore...\n`);

    for (const topper of TOPPERS) {
        const { id, ...data } = topper;
        await setDoc(doc(db, "toppers", id), {
            ...data,
            lastSeen: null,
            createdAt: new Date().toISOString(),
        });
        console.log(`  ✅ Added: ${topper.name} (${topper.college})`);
    }

    console.log("\n🎉 Seeding complete! Check Firebase Console → Firestore → toppers\n");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
});
