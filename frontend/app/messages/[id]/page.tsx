"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
    ArrowLeft, Phone, Video, MoreVertical,
    Send, Paperclip, Smile, Mic, Camera, Loader2,
    MicOff, CheckCircle, AlertCircle, X
} from "lucide-react";

type PermState = "idle" | "requesting" | "granted" | "denied";
type CallType = "voice" | "video";

/* ── Topper / chat data ── */
const CHAT_DATA: Record<string, {
    topperName: string; college: string; tag: string; tagColor: string;
    subject: string; online: boolean; avatarUrl: string;
    messages: { id: string; text: string; from: "me" | "topper"; time: string; status?: "sent" | "read" }[];
}> = {
    "1": {
        topperName: "Ananya Sharma", college: "IIT Bombay", tag: "IIT",
        tagColor: "#6366f1", subject: "Physics", online: true,
        avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
        messages: [
            { id: "m1", from: "me", time: "10:30 AM", status: "read", text: "Hi Ananya! Can you explain rotational dynamics? I'm confused about torque." },
            { id: "m2", from: "topper", time: "10:31 AM", text: "Hey! Sure 😊 Torque is basically the rotational equivalent of force. τ = r × F" },
            { id: "m3", from: "topper", time: "10:31 AM", text: "The magnitude is τ = rF sinθ where θ is the angle between r and F vectors." },
            { id: "m4", from: "me", time: "10:33 AM", status: "read", text: "Oh okay! So if force is applied perpendicular to the lever arm, sinθ = 1 and torque is maximum?" },
            { id: "m5", from: "topper", time: "10:34 AM", text: "Exactly! You got it 🎯 That's why door handles are placed far from the hinge — to maximise torque with minimum force." },
            { id: "m6", from: "me", time: "10:38 AM", status: "read", text: "That makes so much sense. What about moment of inertia?" },
            { id: "m7", from: "topper", time: "10:39 AM", text: "Moment of inertia I = Σmr² — it's like mass for rotation. More mass farther from axis → harder to spin." },
            { id: "m8", from: "topper", time: "10:40 AM", text: "And τ = Iα, just like F = ma. Always remember this analogy! 📝" },
            { id: "m9", from: "me", time: "10:42 AM", status: "sent", text: "Yes! Torque = r × F. Cross product gives the direction too." },
        ]
    },
    "2": {
        topperName: "Rohan Mehta", college: "AIIMS Delhi", tag: "AIIMS",
        tagColor: "#0ea5e9", subject: "Biology", online: false,
        avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
        messages: [
            { id: "m1", from: "me", time: "Yesterday", status: "read", text: "Rohan bhai, Krebs cycle is so confusing. Can you simplify it?" },
            { id: "m2", from: "topper", time: "Yesterday", text: "Of course! Think of it as a 8-step cycle that burns Acetyl-CoA to produce energy molecules." },
            { id: "m3", from: "topper", time: "Yesterday", text: "Per cycle: 3 NADH, 1 FADH₂, 1 ATP (GTP), 2 CO₂ released. Remember '3-1-1-2' 🧬" },
            { id: "m4", from: "me", time: "Yesterday", status: "read", text: "Why does it need to be a cycle though?" },
            { id: "m5", from: "topper", time: "Yesterday", text: "Great question! The cycle regenerates oxaloacetate to keep accepting more Acetyl-CoA. It's self-sustaining!" },
            { id: "m6", from: "me", time: "Yesterday", status: "read", text: "The Krebs cycle regenerates NAD⁺ and FAD to keep glycolysis going." },
        ]
    },
    "3": {
        topperName: "Priya Krishnan", college: "IIT Delhi", tag: "IIT",
        tagColor: "#6366f1", subject: "Chemistry", online: true,
        avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
        messages: [
            { id: "m1", from: "me", time: "Mon", status: "read", text: "Priya didi! I keep mixing up SN1 and SN2 in exams 😭" },
            { id: "m2", from: "topper", time: "Mon", text: "Don't stress! Here's a simple trick 🔑" },
            { id: "m3", from: "topper", time: "Mon", text: "SN1: 2 steps, carbocation intermediate, favoured by 3° carbon + polar protic solvent. Rate depends only on substrate." },
            { id: "m4", from: "topper", time: "Mon", text: "SN2: 1 step, backside attack, favoured by 1° carbon + polar aprotic solvent. Rate = k[substrate][nucleophile]" },
            { id: "m5", from: "me", time: "Mon", status: "read", text: "So steric hindrance matters for which mechanism operates?" },
            { id: "m6", from: "topper", time: "Mon", text: "Exactly! Bulky 3° carbons → SN1. Small 1° carbons → SN2. 2° can go either way depending on conditions ⚗️" },
            { id: "m7", from: "me", time: "Mon", status: "read", text: "SN2 is one-step — backside attack. SN1 is two-step with carbocation." },
        ]
    },
    "4": {
        topperName: "Arjun Verma", college: "NIT Trichy", tag: "NIT",
        tagColor: "#10b981", subject: "Maths", online: false,
        avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
        messages: [
            { id: "m1", from: "me", time: "Sun", status: "read", text: "Arjun bhai, integration by parts is killing me 😅" },
            { id: "m2", from: "topper", time: "Sun", text: "Haha it gets easier! Rule: ∫u dv = uv − ∫v du" },
            { id: "m3", from: "topper", time: "Sun", text: "For LIATE — pick u in this order: Logarithm, Inverse trig, Algebraic, Trig, Exponential" },
            { id: "m4", from: "me", time: "Sun", status: "read", text: "So for ∫ x·eˣ dx, x is Algebraic and eˣ is Exponential, so u = x?" },
            { id: "m5", from: "topper", time: "Sun", text: "Perfect! u=x, dv=eˣdx → du=dx, v=eˣ. So = xeˣ − ∫eˣdx = xeˣ − eˣ + C = eˣ(x−1) + C 📐" },
            { id: "m6", from: "me", time: "Sun", status: "read", text: "Try ∫ x·eˣ dx using tabular integration — it's faster for JEE." },
        ]
    },
    "5": {
        topperName: "Meera Rao", college: "IIT Madras", tag: "IIT",
        tagColor: "#6366f1", subject: "Physics", online: true,
        avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
        messages: [
            { id: "m1", from: "me", time: "Fri", status: "read", text: "Meera di, Gauss law concept iske application samajh nahi aa raha." },
            { id: "m2", from: "topper", time: "Fri", text: "No worries! Gauss law: ∮E·dA = Q_enclosed / ε₀" },
            { id: "m3", from: "topper", time: "Fri", text: "The key insight: choose a Gaussian surface where E is either constant OR zero on each part." },
            { id: "m4", from: "me", time: "Fri", status: "read", text: "Like for a sphere of charge, we take a spherical Gaussian surface?" },
            { id: "m5", from: "topper", time: "Fri", text: "Exactly! By symmetry, E is same everywhere on that surface → EA = Q/ε₀ → E = Q/(4πε₀r²) 🔬" },
            { id: "m6", from: "me", time: "Fri", status: "read", text: "Gauss law holds for any closed surface — shape doesn't matter!" },
        ]
    }
};

type Msg = { id: string; text: string; from: "me" | "topper"; time: string; status?: string };

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const chat = CHAT_DATA[id];

    const [messages, setMessages] = useState<Msg[]>(chat?.messages || []);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showCallOptions, setShowCallOptions] = useState(false);
    const [permState, setPermState] = useState<PermState>("idle");
    const [callType, setCallType] = useState<CallType>("video");
    const [showCalling, setShowCalling] = useState(false);
    const [callSeconds, setCallSeconds] = useState(0);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [reportConfirm, setReportConfirm] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [ratingStars, setRatingStars] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Zegocloud real-call refs
    const zegoSessionRef = useRef<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        zg: any | null;
        localStream: MediaStream | null;
        streamID: string;
        roomID: string;
    } | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const [remoteJoined, setRemoteJoined] = useState(false);

    // Stop any active stream on unmount + cleanup Zegocloud
    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
            if (zegoSessionRef.current?.zg) {
                import("../../../lib/zego").then(({ stopZegoCall }) => {
                    if (zegoSessionRef.current) stopZegoCall(zegoSessionRef.current as Parameters<typeof stopZegoCall>[0]);
                });
            }
        };
    }, []);

    // 🔴 Start Zegocloud when call screen appears
    useEffect(() => {
        if (!showCalling) return;
        let cancelled = false;
        import("../../../lib/zego").then(({ startZegoCall }) => {
            if (cancelled) return;
            startZegoCall({
                conversationId: id,
                role: "student",
                isVideo: callType === "video",
                localVideoEl: localVideoRef.current,
                remoteAudioEl: remoteAudioRef.current,
                remoteVideoEl: remoteVideoRef.current,
                onRemoteUserJoined: () => setRemoteJoined(true),
            }).then(session => {
                if (!cancelled) zegoSessionRef.current = session;
            }).catch(err => console.warn("Zegocloud call error:", err));
        });
        return () => { cancelled = true; };
    }, [showCalling, id, callType]);

    const requestPermAndCall = useCallback(async (type: CallType) => {
        setCallType(type);
        setPermState("requesting");
        try {
            const constraints = type === "video"
                ? { video: { facingMode: "user" }, audio: true }
                : { audio: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            setPermState("granted");
            setTimeout(() => {
                stream.getTracks().forEach(t => t.stop());
                setPermState("idle");
                setShowCallOptions(false);
                setCallSeconds(0);
                setRemoteJoined(false);
                setShowCalling(true);
                timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
            }, 1200);
        } catch {
            setPermState("denied");
        }
    }, []);

    const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const handleEndCall = () => {
        // Always show confirmation first
        setShowEndConfirm(true);
    };

    const confirmEndCall = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        // Clean up Zegocloud session
        if (zegoSessionRef.current) {
            import("../../../lib/zego").then(({ stopZegoCall }) => {
                if (zegoSessionRef.current) stopZegoCall(zegoSessionRef.current as Parameters<typeof stopZegoCall>[0]);
                zegoSessionRef.current = null;
            });
        }
        setShowEndConfirm(false);
        setShowCalling(false);
        setRemoteJoined(false);
        setTimeout(() => { setShowRating(true); setRatingStars(0); setRatingComment(""); setRatingSubmitted(false); }, 400);
    };

    const submitRating = () => {
        setRatingSubmitted(true);
        setTimeout(() => setShowRating(false), 2000);
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!chat) {
        return (
            <div style={{
                background: "#0d1117", minHeight: "100vh", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#94a3b8"
            }}>
                Chat not found
            </div>
        );
    }

    const sendMessage = () => {
        if (!input.trim()) return;
        const now = new Date();
        const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        const newMsg: Msg = { id: Date.now().toString(), from: "me", text: input.trim(), time, status: "sent" };
        setMessages(prev => [...prev, newMsg]);
        setInput("");

        // Simulate topper typing then replying
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const reply: Msg = {
                id: (Date.now() + 1).toString(),
                from: "topper",
                text: "Great question! Let me explain that in detail. Keep practising — you're doing really well! 💪",
                time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
            };
            setMessages(prev => [...prev, reply]);
        }, 2000);
    };

    return (
        <div style={{
            maxWidth: 480, margin: "0 auto", height: "100vh",
            background: "#0d1117", display: "flex", flexDirection: "column",
            position: "relative"
        }}>

            <style>{`
        @keyframes typingDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        @keyframes slideDown{from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>

            {/* ══ HEADER ══ */}
            <header style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: "linear-gradient(180deg,#13192b 0%,#161b27 100%)",
                borderBottom: "1px solid rgba(99,102,241,0.15)",
                flexShrink: 0, zIndex: 10
            }}>
                {/* Back */}
                <button onClick={() => router.push("/messages")} style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)", border: "none",
                    color: "#94a3b8", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", flexShrink: 0
                }}>
                    <ArrowLeft size={18} />
                </button>

                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }} onClick={() => { }}>
                    <img src={chat.avatarUrl} alt="" style={{
                        width: 42, height: 42, borderRadius: "50%",
                        objectFit: "cover", objectPosition: "top",
                        border: `2px solid ${chat.tagColor}55`
                    }} />
                    {chat.online && (
                        <div style={{
                            position: "absolute", bottom: 0, right: 0,
                            width: 11, height: 11, borderRadius: "50%",
                            background: "#22c55e", border: "2px solid #161b27"
                        }} />
                    )}
                </div>

                {/* Name + status */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.2 }}>
                        {chat.topperName}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: chat.online ? "#22c55e" : "#475569" }}>
                        {isTyping ? "typing..." : chat.online ? "online" : `${chat.college}`}
                    </p>
                </div>

                {/* Call buttons — WhatsApp style */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {/* Voice call */}
                    <button
                        onClick={() => setShowCallOptions(true)}
                        style={{
                            width: 38, height: 38, borderRadius: "50%",
                            background: "rgba(34,197,94,0.12)",
                            border: "1px solid rgba(34,197,94,0.25)",
                            color: "#4ade80", display: "flex", alignItems: "center",
                            justifyContent: "center", cursor: "pointer"
                        }}
                    >
                        <Phone size={17} />
                    </button>
                    {/* Video call */}
                    <button
                        onClick={() => setShowCallOptions(true)}
                        style={{
                            width: 38, height: 38, borderRadius: "50%",
                            background: "rgba(99,102,241,0.12)",
                            border: "1px solid rgba(99,102,241,0.25)",
                            color: "#818cf8", display: "flex", alignItems: "center",
                            justifyContent: "center", cursor: "pointer"
                        }}
                    >
                        <Video size={17} />
                    </button>
                    <button style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#475569", display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer"
                    }}>
                        <MoreVertical size={17} />
                    </button>
                </div>
            </header>

            {/* ── Subject strip ── */}
            <div style={{
                padding: "6px 16px",
                background: "rgba(99,102,241,0.06)",
                borderBottom: "1px solid rgba(99,102,241,0.1)",
                flexShrink: 0
            }}>
                <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 600 }}>
                    📖 Session topic: {chat.subject} · {chat.college}
                </span>
            </div>

            {/* ══ MESSAGES ══ */}
            <div style={{
                flex: 1, overflowY: "auto", padding: "12px 14px",
                display: "flex", flexDirection: "column", gap: 4
            }}>
                {/* Date label */}
                <div style={{ textAlign: "center", margin: "8px 0" }}>
                    <span style={{
                        background: "rgba(255,255,255,0.06)", borderRadius: 50,
                        padding: "3px 12px", fontSize: 10, color: "#475569", fontWeight: 600
                    }}>Today</span>
                </div>

                {messages.map((msg, i) => {
                    const isMe = msg.from === "me";
                    const prevSame = i > 0 && messages[i - 1].from === msg.from;
                    return (
                        <div key={msg.id} style={{
                            display: "flex", flexDirection: "column",
                            alignItems: isMe ? "flex-end" : "flex-start",
                            marginTop: prevSame ? 2 : 8
                        }}>
                            <div style={{
                                maxWidth: "75%",
                                background: isMe
                                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                                    : "#1e2535",
                                border: isMe ? "none" : "1px solid rgba(255,255,255,0.07)",
                                borderRadius: isMe
                                    ? (prevSame ? "18px 18px 4px 18px" : "18px 4px 18px 18px")
                                    : (prevSame ? "18px 18px 18px 4px" : "4px 18px 18px 18px"),
                                padding: "9px 13px",
                                boxShadow: isMe ? "0 2px 12px rgba(99,102,241,0.35)" : "none"
                            }}>
                                <p style={{
                                    margin: 0, fontSize: 13, lineHeight: 1.5,
                                    color: isMe ? "#fff" : "#cbd5e1"
                                }}>{msg.text}</p>
                            </div>
                            {/* Time + status */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 3,
                                marginTop: 2, paddingLeft: 4, paddingRight: 4
                            }}>
                                <span style={{ fontSize: 9, color: "#334155" }}>{msg.time}</span>
                                {isMe && msg.status === "read" && (
                                    <span style={{ fontSize: 9, color: "#818cf8" }}>✓✓</span>
                                )}
                                {isMe && msg.status === "sent" && (
                                    <span style={{ fontSize: 9, color: "#475569" }}>✓</span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Typing indicator */}
                {isTyping && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 4 }}>
                        <img src={chat.avatarUrl} alt="" style={{
                            width: 24, height: 24, borderRadius: "50%", objectFit: "cover", objectPosition: "top"
                        }} />
                        <div style={{
                            background: "#1e2535", border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "4px 18px 18px 18px", padding: "10px 16px",
                            display: "flex", gap: 4, alignItems: "center"
                        }}>
                            {[0, 1, 2].map(d => (
                                <div key={d} style={{
                                    width: 7, height: 7, borderRadius: "50%", background: "#475569",
                                    animation: `typingDot 1s ${d * 0.2}s ease-in-out infinite`
                                }} />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* ══ INPUT BAR ══ */}
            <div style={{
                padding: "10px 12px",
                background: "#13192b",
                borderTop: "1px solid rgba(99,102,241,0.12)",
                display: "flex", alignItems: "flex-end", gap: 8, flexShrink: 0
            }}>
                <button style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#475569", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", flexShrink: 0
                }}>
                    <Smile size={18} />
                </button>

                <div style={{
                    flex: 1, background: "#1e2535",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 24, padding: "8px 16px",
                    display: "flex", alignItems: "center"
                }}>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder="Type a message..."
                        style={{
                            flex: 1, background: "transparent", border: "none",
                            color: "#e2e8f0", fontSize: 13, outline: "none"
                        }}
                    />
                    <button style={{
                        background: "none", border: "none", color: "#475569",
                        cursor: "pointer", padding: 0, display: "flex"
                    }}>
                        <Paperclip size={16} />
                    </button>
                </div>

                {input.trim() ? (
                    <button onClick={sendMessage} style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        border: "none", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", flexShrink: 0,
                        boxShadow: "0 2px 12px rgba(99,102,241,0.5)"
                    }}>
                        <Send size={18} />
                    </button>
                ) : (
                    <button style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", flexShrink: 0
                    }}>
                        <Mic size={18} />
                    </button>
                )}
            </div>

            {/* ══ CALL OPTIONS MODAL ══ */}
            {showCallOptions && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 100,
                    display: "flex", alignItems: "flex-end",
                    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)"
                }}
                    onClick={() => setShowCallOptions(false)}
                >
                    <div style={{
                        width: "100%", maxWidth: 480, margin: "0 auto",
                        background: "#13192b",
                        borderRadius: "24px 24px 0 0",
                        borderTop: "1px solid rgba(99,102,241,0.2)",
                        padding: "20px 20px 32px",
                        animation: "slideDown 0.25s ease-out"
                    }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Topper info */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                            <img src={chat.avatarUrl} alt="" style={{
                                width: 50, height: 50, borderRadius: "50%",
                                objectFit: "cover", objectPosition: "top"
                            }} />
                            <div>
                                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>
                                    {chat.topperName}
                                </p>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                                    {chat.college} · {chat.subject}
                                </p>
                            </div>
                        </div>

                        {/* Permission states */}
                        {permState === "requesting" && (
                            <div style={{
                                textAlign: "center", padding: "16px 0", display: "flex",
                                flexDirection: "column", alignItems: "center", gap: 10
                            }}>
                                <Loader2 size={28} color="#818cf8" style={{ animation: "spin 1s linear infinite" }} />
                                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
                                    {callType === "video" ? "📷 Requesting camera & microphone..." : "🎤 Requesting microphone..."}
                                </p>
                                <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
                                    Please allow access in your browser popup
                                </p>
                            </div>
                        )}

                        {permState === "granted" && (
                            <div style={{
                                textAlign: "center", padding: "16px 0", display: "flex",
                                flexDirection: "column", alignItems: "center", gap: 10
                            }}>
                                <CheckCircle size={32} color="#22c55e" />
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#4ade80" }}>
                                    ✅ Access granted! Connecting...
                                </p>
                            </div>
                        )}

                        {permState === "denied" && (
                            <div style={{
                                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                                borderRadius: 14, padding: "14px 16px", marginBottom: 12
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <AlertCircle size={16} color="#ef4444" />
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#f87171" }}>
                                        {callType === "video" ? "Camera & Mic" : "Microphone"} access denied
                                    </p>
                                </div>
                                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                                    To fix: click the 🔒 lock icon in your browser's address bar → Site Settings → Allow camera and microphone.
                                </p>
                                <button onClick={() => setPermState("idle")} style={{
                                    marginTop: 10, padding: "7px 14px", borderRadius: 8,
                                    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                                    color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer"
                                }}>Try Again</button>
                            </div>
                        )}

                        {/* Call option buttons — only when idle or denied */}
                        {(permState === "idle" || permState === "denied") && (
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => requestPermAndCall("voice")}
                                    style={{
                                        flex: 1, padding: "15px 0", borderRadius: 16,
                                        background: "linear-gradient(135deg,#22c55e,#16a34a)",
                                        border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
                                        cursor: "pointer", display: "flex", alignItems: "center",
                                        justifyContent: "center", gap: 9,
                                        boxShadow: "0 4px 20px rgba(34,197,94,0.45)"
                                    }}>
                                    <Phone size={18} /> Voice Call
                                </button>
                                <button onClick={() => requestPermAndCall("video")}
                                    style={{
                                        flex: 1, padding: "15px 0", borderRadius: 16,
                                        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                        border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
                                        cursor: "pointer", display: "flex", alignItems: "center",
                                        justifyContent: "center", gap: 9,
                                        boxShadow: "0 4px 20px rgba(99,102,241,0.45)"
                                    }}>
                                    <Video size={18} /> Video Call
                                </button>
                            </div>
                        )}

                        {/* Pricing */}
                        <p style={{ textAlign: "center", margin: "12px 0 0", fontSize: 11, color: "#475569" }}>
                            ₹50 flat for first 5 min · then ₹10/min · Cancel anytime
                        </p>

                        {permState !== "requesting" && permState !== "granted" && (
                            <button onClick={() => { setShowCallOptions(false); setPermState("idle"); }}
                                style={{
                                    display: "block", width: "100%", marginTop: 12, padding: "12px",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: 14, color: "#64748b", fontSize: 13,
                                    fontWeight: 600, cursor: "pointer"
                                }}>Cancel</button>
                        )}
                    </div>
                </div>
            )}

            {/* ══ CALLING OVERLAY ══ */}
            {showCalling && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 200,
                    background: "linear-gradient(180deg,#0a0f1e 0%,#0d1117 100%)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 16,
                    padding: "24px 16px"
                }}>
                    <style>{`@keyframes callPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.6)}60%{box-shadow:0 0 0 20px rgba(34,197,94,0)}}`}</style>

                    {/* 🔊 Hidden audio: plays topper's real voice via Zegocloud */}
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

                    {/* 📹 Video windows — only for video calls */}
                    {callType === "video" && (
                        <div style={{ position: "relative", width: "100%", maxWidth: 340, borderRadius: 18, overflow: "hidden", background: "#0a0f1e", aspectRatio: "4/3" }}>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video ref={remoteVideoRef} autoPlay playsInline
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: remoteJoined ? "block" : "none" }} />
                            {!remoteJoined && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#334155", fontSize: 13, position: "absolute", inset: 0 }}>
                                    Waiting for topper to join...
                                </div>
                            )}
                            {/* PiP local preview */}
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video ref={localVideoRef} autoPlay playsInline muted
                                style={{ position: "absolute", bottom: 10, right: 10, width: 84, height: 64, objectFit: "cover", borderRadius: 10, border: "2px solid rgba(255,255,255,0.2)" }} />
                        </div>
                    )}

                    {/* Topper avatar — voice call only */}
                    {callType !== "video" && (
                        <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", animation: "callPulse 1.5s ease-in-out infinite", border: "3px solid #22c55e" }}>
                            <img src={chat.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                        </div>
                    )}

                    {/* Name + college */}
                    <div style={{ textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: 1.5 }}>
                            {callType === "video" ? "📹 Video Call" : "📞 Voice Call"}
                        </p>
                        <p style={{ margin: "6px 0 2px", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>{chat.topperName}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{chat.college}</p>
                    </div>

                    {/* 🟢 Real connection status (from Zegocloud roomStreamUpdate) */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: remoteJoined ? "rgba(34,197,94,0.12)" : "rgba(251,191,36,0.12)",
                        border: `1px solid ${remoteJoined ? "rgba(34,197,94,0.3)" : "rgba(251,191,36,0.3)"}`,
                        borderRadius: 50, padding: "4px 16px"
                    }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: remoteJoined ? "#22c55e" : "#fbbf24", display: "inline-block" }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: remoteJoined ? "#4ade80" : "#fbbf24" }}>
                            {remoteJoined ? "Connected" : "Connecting to topper..."}
                        </span>
                    </div>

                    {/* Live timer */}
                    <div style={{
                        background: callSeconds < 300 ? "rgba(251,191,36,0.1)" : "rgba(34,197,94,0.1)",
                        border: `1px solid ${callSeconds < 300 ? "rgba(251,191,36,0.3)" : "rgba(34,197,94,0.3)"}`,
                        borderRadius: 50, padding: "6px 20px", display: "flex", alignItems: "center", gap: 8
                    }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: callSeconds < 300 ? "#fbbf24" : "#22c55e", display: "inline-block" }} />
                        <span style={{ fontSize: 22, fontWeight: 900, color: callSeconds < 300 ? "#fbbf24" : "#4ade80", fontVariantNumeric: "tabular-nums" }}>
                            {fmtTime(callSeconds)}
                        </span>
                        {callSeconds < 300 && <span style={{ fontSize: 10, color: "#94a3b8" }}>/ ₹50 flat</span>}
                    </div>

                    {/* ₹ deduction info */}
                    <p style={{ margin: 0, fontSize: 11, color: "#475569", textAlign: "center" }}>
                        {callSeconds < 300
                            ? `₹50 flat for first 5 min · ${Math.ceil((300 - callSeconds) / 60)} min remaining`
                            : `₹${50 + Math.ceil((callSeconds - 300) / 60) * 10} charged so far · ₹10/min`}
                    </p>

                    {/* 🔴 Report */}
                    <button onClick={() => setShowReport(true)} style={{
                        padding: "7px 18px", borderRadius: 50,
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
                        color: "#f87171", fontSize: 12, fontWeight: 800, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6
                    }}>🚨 Report Issue</button>

                    {/* End call */}
                    <button onClick={handleEndCall} style={{
                        width: 64, height: 64, borderRadius: "50%",
                        background: "linear-gradient(135deg,#ef4444,#dc2626)",
                        border: "none", color: "#fff", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 24px rgba(239,68,68,0.6)"
                    }}>
                        <X size={26} />
                    </button>
                    <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>Tap to end call</p>
                </div>
            )}

            {/* ══ END CALL CONFIRMATION ══ */}
            {showEndConfirm && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 300,
                    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "flex-end", justifyContent: "center"
                }}>
                    <div style={{
                        width: "100%", maxWidth: 480, background: "#13192b",
                        borderRadius: "24px 24px 0 0", padding: "24px 20px 36px",
                        borderTop: "1px solid rgba(239,68,68,0.25)"
                    }}>
                        <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#f87171" }}>⚠️ End Call?</p>
                        {callSeconds < 300 ? (
                            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                                You are <strong style={{ color: "#fbbf24" }}>within the first 5 minutes</strong>. Ending now will still deduct the full{" "}
                                <strong style={{ color: "#ef4444" }}>₹50 minimum charge</strong> — no refund.
                            </p>
                        ) : (
                            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                                Call duration: <strong style={{ color: "#e2e8f0" }}>{fmtTime(callSeconds)}</strong> ·{" "}
                                <strong style={{ color: "#ef4444" }}>₹{50 + Math.ceil((callSeconds - 300) / 60) * 10}</strong> will be deducted.
                            </p>
                        )}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setShowEndConfirm(false)} style={{
                                flex: 1, padding: "14px", borderRadius: 14,
                                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                                color: "#e2e8f0", fontSize: 14, fontWeight: 700, cursor: "pointer"
                            }}>Continue Call</button>
                            <button onClick={confirmEndCall} style={{
                                flex: 1, padding: "14px", borderRadius: 14,
                                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                                border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                                boxShadow: "0 4px 16px rgba(239,68,68,0.4)"
                            }}>Yes, End Call</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ REPORT MODAL ══ */}
            {showReport && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 300,
                    background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "flex-end", justifyContent: "center"
                }}>
                    <div style={{
                        width: "100%", maxWidth: 480, background: "#13192b",
                        borderRadius: "24px 24px 0 0", padding: "24px 20px 36px",
                        borderTop: "1px solid rgba(239,68,68,0.3)"
                    }}>
                        {!reportConfirm ? (
                            <>
                                <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#f87171" }}>🚨 Report & End Call</p>
                                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                                    Reporting will <strong style={{ color: "#e2e8f0" }}>immediately end the call</strong>. Payment will be{" "}
                                    <strong style={{ color: "#fbbf24" }}>held for 15 days</strong> and settled after our team reviews the case.
                                </p>
                                <div style={{
                                    background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
                                    borderRadius: 12, padding: "12px 14px", marginBottom: 20
                                }}>
                                    <p style={{ margin: 0, fontSize: 12, color: "#fbbf24", lineHeight: 1.6 }}>
                                        ⚠️ False reports will result in account suspension. Only report genuine misconduct.
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={() => setShowReport(false)} style={{
                                        flex: 1, padding: "14px", borderRadius: 14,
                                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                                        color: "#e2e8f0", fontSize: 13, fontWeight: 700, cursor: "pointer"
                                    }}>Cancel</button>
                                    <button onClick={() => setReportConfirm(true)} style={{
                                        flex: 1, padding: "14px", borderRadius: 14,
                                        background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
                                        color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer"
                                    }}>Yes, Report →</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#f87171" }}>Confirm Report?</p>
                                <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                                    This action cannot be undone. The call will end and our team will review within <strong style={{ color: "#e2e8f0" }}>72 hours</strong>.
                                </p>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={() => { setReportConfirm(false); setShowReport(false); }} style={{
                                        flex: 1, padding: "14px", borderRadius: 14,
                                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                                        color: "#e2e8f0", fontSize: 13, fontWeight: 700, cursor: "pointer"
                                    }}>Go Back</button>
                                    <button onClick={() => {
                                        if (timerRef.current) clearInterval(timerRef.current);
                                        setShowReport(false); setReportConfirm(false);
                                        setShowCalling(false);
                                        setTimeout(() => setShowRating(true), 400);
                                    }} style={{
                                        flex: 1, padding: "14px", borderRadius: 14,
                                        background: "linear-gradient(135deg,#ef4444,#dc2626)",
                                        border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer"
                                    }}>Submit Report 🚨</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ══ POST-CALL RATING POPUP ══ */}
            {showRating && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 300,
                    background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px"
                }}>
                    <div style={{
                        width: "100%", maxWidth: 440,
                        background: "linear-gradient(180deg,#13192b,#0d1117)",
                        borderRadius: 28, padding: "28px 24px",
                        border: "1px solid rgba(99,102,241,0.2)",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.6)"
                    }}>
                        {!ratingSubmitted ? (
                            <>
                                <div style={{ textAlign: "center", marginBottom: 20 }}>
                                    <img src={chat.avatarUrl} alt="" style={{
                                        width: 72, height: 72, borderRadius: "50%",
                                        objectFit: "cover", objectPosition: "top",
                                        border: "3px solid #6366f1", marginBottom: 12
                                    }} />
                                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>Rate your session</p>
                                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>with {chat.topperName} · {fmtTime(callSeconds)}</p>
                                </div>

                                {/* Stars */}
                                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button key={n} onClick={() => setRatingStars(n)}
                                            style={{
                                                fontSize: 36, background: "none", border: "none",
                                                cursor: "pointer", opacity: n <= ratingStars ? 1 : 0.25,
                                                transform: n <= ratingStars ? "scale(1.15)" : "scale(1)",
                                                transition: "all 0.15s"
                                            }}>⭐</button>
                                    ))}
                                </div>

                                {ratingStars > 0 && (
                                    <p style={{ textAlign: "center", margin: "-10px 0 12px", fontSize: 13, color: "#818cf8", fontWeight: 700 }}>
                                        {["Terrible", "Poor", "Okay", "Good", "Amazing! 🎉"][ratingStars - 1]}
                                    </p>
                                )}

                                {/* Comment */}
                                <textarea
                                    value={ratingComment}
                                    onChange={e => setRatingComment(e.target.value)}
                                    placeholder="Share feedback (optional) — helps the topper improve..."
                                    rows={3}
                                    style={{
                                        width: "100%", padding: "12px 14px", borderRadius: 14,
                                        background: "#161b27", border: "1.5px solid rgba(99,102,241,0.2)",
                                        color: "#e2e8f0", fontSize: 13, outline: "none",
                                        resize: "none", boxSizing: "border-box", fontFamily: "inherit",
                                        marginBottom: 16
                                    }}
                                />

                                <button onClick={submitRating} disabled={ratingStars === 0} style={{
                                    width: "100%", padding: "15px", borderRadius: 16,
                                    background: ratingStars > 0 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)",
                                    border: "none", color: ratingStars > 0 ? "#fff" : "#334155",
                                    fontSize: 15, fontWeight: 800,
                                    cursor: ratingStars > 0 ? "pointer" : "not-allowed",
                                    boxShadow: ratingStars > 0 ? "0 4px 20px rgba(99,102,241,0.4)" : "none",
                                    marginBottom: 10
                                }}>Submit Rating ✓</button>

                                <button onClick={() => setShowRating(false)} style={{
                                    width: "100%", padding: "12px", borderRadius: 14,
                                    background: "transparent", border: "none",
                                    color: "#475569", fontSize: 13, cursor: "pointer"
                                }}>Skip for now</button>
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                <p style={{ fontSize: 48, margin: "0 0 12px" }}>🎉</p>
                                <p style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#4ade80" }}>Thanks for rating!</p>
                                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Your feedback helps {chat.topperName} improve.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
