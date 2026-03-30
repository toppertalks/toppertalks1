import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip, Smile, Mic, Loader2, CheckCircle, AlertCircle, X, PhoneOff } from "lucide-react";
import { startSession, endSession, submitRating as apiSubmitRating } from "../lib/api-client";
import { startZegoCall, stopZegoCall } from "../lib/zego";

const CHAT_DATA = {
  "1": { topperName: "Ananya Sharma", college: "IIT Bombay", tag: "IIT", tagColor: "#6366f1", subject: "Physics", online: true, avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg", messages: [
    { id: "m1", from: "me", time: "10:30 AM", status: "read", text: "Hi Ananya! Can you explain rotational dynamics? I'm confused about torque." },
    { id: "m2", from: "topper", time: "10:31 AM", text: "Hey! Sure 😊 Torque is basically the rotational equivalent of force. τ = r × F" },
    { id: "m3", from: "topper", time: "10:31 AM", text: "The magnitude is τ = rF sinθ where θ is the angle between r and F vectors." },
    { id: "m4", from: "me", time: "10:33 AM", status: "read", text: "Oh okay! So if force is applied perpendicular to the lever arm, sinθ = 1 and torque is maximum?" },
    { id: "m5", from: "topper", time: "10:34 AM", text: "Exactly! You got it 🎯 That's why door handles are placed far from the hinge — to maximise torque with minimum force." },
    { id: "m6", from: "me", time: "10:38 AM", status: "read", text: "That makes so much sense. What about moment of inertia?" },
    { id: "m7", from: "topper", time: "10:39 AM", text: "Moment of inertia I = Σmr² — it's like mass for rotation. More mass farther from axis → harder to spin." },
    { id: "m8", from: "topper", time: "10:40 AM", text: "And τ = Iα, just like F = ma. Always remember this analogy! 📝" },
    { id: "m9", from: "me", time: "10:42 AM", status: "sent", text: "Yes! Torque = r × F. Cross product gives the direction too." },
  ]},
  "2": { topperName: "Rohan Mehta", college: "AIIMS Delhi", tag: "AIIMS", tagColor: "#0ea5e9", subject: "Biology", online: false, avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg", messages: [
    { id: "m1", from: "me", time: "Yesterday", status: "read", text: "Rohan bhai, Krebs cycle is so confusing. Can you simplify it?" },
    { id: "m2", from: "topper", time: "Yesterday", text: "Of course! Think of it as a 8-step cycle that burns Acetyl-CoA to produce energy molecules." },
    { id: "m3", from: "topper", time: "Yesterday", text: "Per cycle: 3 NADH, 1 FADH₂, 1 ATP (GTP), 2 CO₂ released. Remember '3-1-1-2' 🧬" },
  ]},
  "3": { topperName: "Priya Krishnan", college: "IIT Delhi", tag: "IIT", tagColor: "#6366f1", subject: "Chemistry", online: true, avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg", messages: [
    { id: "m1", from: "me", time: "Mon", status: "read", text: "Priya didi! I keep mixing up SN1 and SN2 in exams 😭" },
    { id: "m2", from: "topper", time: "Mon", text: "Don't stress! SN1: 2 steps, carbocation, 3° carbon. SN2: 1 step, backside attack, 1° carbon." },
  ]},
  "4": { topperName: "Arjun Verma", college: "NIT Trichy", tag: "NIT", tagColor: "#10b981", subject: "Maths", online: false, avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg", messages: [
    { id: "m1", from: "me", time: "Sun", status: "read", text: "Arjun bhai, integration by parts is killing me 😅" },
    { id: "m2", from: "topper", time: "Sun", text: "Use LIATE rule. ∫u dv = uv − ∫v du" },
  ]},
  "5": { topperName: "Meera Rao", college: "IIT Madras", tag: "IIT", tagColor: "#6366f1", subject: "Physics", online: true, avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg", messages: [
    { id: "m1", from: "me", time: "Fri", status: "read", text: "Meera di, Gauss law concept samajh nahi aa raha." },
    { id: "m2", from: "topper", time: "Fri", text: "Gauss law: ∮E·dA = Q_enclosed / ε₀. Choose symmetry!" },
  ]},
};

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chat = CHAT_DATA[id];
  const [messages, setMessages] = useState(chat?.messages || []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [permState, setPermState] = useState("idle");
  const [callType, setCallType] = useState("video");
  const [showCalling, setShowCalling] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const [remoteJoined, setRemoteJoined] = useState(false);
  const streamRef = useRef(null);
  const bottomRef = useRef(null);
  const timerRef = useRef(null);
  const zegoSessionRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (zegoSessionRef.current) stopZegoCall(zegoSessionRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showCalling) return;
    let cancelled = false;
    startZegoCall({ conversationId: id, role: "student", isVideo: callType === "video", localVideoEl: localVideoRef.current, remoteAudioEl: remoteAudioRef.current, remoteVideoEl: remoteVideoRef.current, onRemoteUserJoined: () => setRemoteJoined(true) })
      .then(session => { if (!cancelled) zegoSessionRef.current = session; })
      .catch(err => console.warn("Zegocloud call error:", err));
    return () => { cancelled = true; };
  }, [showCalling, id, callType]);

  const requestPermAndCall = useCallback(async (type) => {
    setCallType(type); setPermState("requesting"); setSessionError("");
    try {
      const constraints = type === "video" ? { video: { facingMode: "user" }, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const sessionResult = await startSession(id);
      setActiveSessionId(sessionResult.sessionId);
      setPermState("granted");
      setTimeout(() => {
        stream.getTracks().forEach(t => t.stop());
        setPermState("idle"); setShowCallOptions(false); setCallSeconds(0); setRemoteJoined(false); setShowCalling(true);
        timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
      }, 1200);
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes("Permission") || msg.includes("NotAllowed") || msg.includes("getUserMedia")) { setPermState("denied"); }
      else { setPermState("idle"); setSessionError(msg); }
    }
  }, [id]);

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const confirmEndCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (zegoSessionRef.current) { stopZegoCall(zegoSessionRef.current); zegoSessionRef.current = null; }
    if (activeSessionId) { try { await endSession(activeSessionId); } catch {} }
    setShowEndConfirm(false); setShowCalling(false); setRemoteJoined(false);
    setTimeout(() => { setShowRating(true); setRatingStars(0); setRatingComment(""); setRatingSubmitted(false); }, 400);
  };

  const handleSubmitRating = async () => {
    if (activeSessionId && ratingStars > 0) { try { await apiSubmitRating(activeSessionId, ratingStars, ratingComment); } catch {} }
    setRatingSubmitted(true);
    setTimeout(() => setShowRating(false), 2000);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!chat) return <div style={{ background: "#0d1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Chat not found</div>;

  const sendMessage = () => {
    if (!input.trim()) return;
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { id: Date.now().toString(), from: "me", text: input.trim(), time, status: "sent" }]);
    setInput(""); setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), from: "topper", text: "Great question! Let me explain that in detail. Keep practising — you're doing really well! 💪", time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
    }, 2000);
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", height: "100vh", background: "#0d1117", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "linear-gradient(180deg,#13192b 0%,#161b27 100%)", borderBottom: "1px solid rgba(99,102,241,0.15)", flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/messages")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><ArrowLeft size={18} /></button>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={chat.avatarUrl} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: `2px solid ${chat.tagColor}55` }} />
          {chat.online && <div style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: "#22c55e", border: "2px solid #161b27" }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.2 }}>{chat.topperName}</p>
          <p style={{ margin: 0, fontSize: 11, color: isTyping ? "#22c55e" : chat.online ? "#22c55e" : "#475569" }}>{isTyping ? "typing..." : chat.online ? "online" : chat.college}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => setShowCallOptions(true)} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Phone size={17} /></button>
          <button onClick={() => setShowCallOptions(true)} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Video size={17} /></button>
        </div>
      </header>

      <div style={{ padding: "6px 16px", background: "rgba(99,102,241,0.06)", borderBottom: "1px solid rgba(99,102,241,0.1)", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 600 }}>📖 Session topic: {chat.subject} · {chat.college}</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ textAlign: "center", margin: "8px 0" }}><span style={{ background: "rgba(255,255,255,0.06)", borderRadius: 50, padding: "3px 12px", fontSize: 10, color: "#475569", fontWeight: 600 }}>Today</span></div>
        {messages.map((msg, i) => {
          const isMe = msg.from === "me";
          const prevSame = i > 0 && messages[i-1].from === msg.from;
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginTop: prevSame ? 2 : 8 }}>
              <div style={{ maxWidth: "75%", background: isMe ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#1e2535", border: isMe ? "none" : "1px solid rgba(255,255,255,0.07)", borderRadius: isMe ? (prevSame ? "18px 18px 4px 18px" : "18px 4px 18px 18px") : (prevSame ? "18px 18px 18px 4px" : "4px 18px 18px 18px"), padding: "9px 13px", boxShadow: isMe ? "0 2px 12px rgba(99,102,241,0.35)" : "none" }}>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: isMe ? "#fff" : "#cbd5e1" }}>{msg.text}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>
                <span style={{ fontSize: 9, color: "#334155" }}>{msg.time}</span>
                {isMe && msg.status === "read" && <span style={{ fontSize: 9, color: "#818cf8" }}>✓✓</span>}
                {isMe && msg.status === "sent" && <span style={{ fontSize: 9, color: "#475569" }}>✓</span>}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 4 }}>
            <img src={chat.avatarUrl} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", objectPosition: "top" }} />
            <div style={{ background: "#1e2535", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 18px 18px 18px", padding: "10px 16px", display: "flex", gap: 4, alignItems: "center" }}>
              {[0,1,2].map(d => <div key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "#475569", animation: `pulse ${1}s ${d*0.2}s ease-in-out infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{ padding: "10px 12px", background: "#13192b", borderTop: "1px solid rgba(99,102,241,0.12)", display: "flex", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <button style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Smile size={18} /></button>
        <div style={{ flex: 1, background: "#1e2535", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 24, padding: "8px 16px", display: "flex", alignItems: "center" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()} placeholder="Type a message..." style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
          <button style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 0, display: "flex" }}><Paperclip size={16} /></button>
        </div>
        {input.trim() ? (
          <button onClick={sendMessage} style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 12px rgba(99,102,241,0.5)" }}><Send size={18} /></button>
        ) : (
          <button style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Mic size={18} /></button>
        )}
      </div>

      {/* Call Options Modal */}
      {showCallOptions && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setShowCallOptions(false)}>
          <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#13192b", borderRadius: "24px 24px 0 0", borderTop: "1px solid rgba(99,102,241,0.2)", padding: "20px 20px 32px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <img src={chat.avatarUrl} alt="" style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", objectPosition: "top" }} />
              <div><p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{chat.topperName}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{chat.college} · {chat.subject}</p></div>
            </div>
            {sessionError && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><AlertCircle size={16} color="#ef4444" /><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#f87171" }}>Cannot start call</p></div><p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>{sessionError}</p></div>}
            {permState === "requesting" && <div style={{ textAlign: "center", padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}><Loader2 size={28} color="#818cf8" style={{ animation: "spin 1s linear infinite" }} /><p style={{ margin: 0, fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{callType === "video" ? "📷 Requesting camera & microphone..." : "🎤 Requesting microphone..."}</p></div>}
            {permState === "granted" && <div style={{ textAlign: "center", padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}><CheckCircle size={32} color="#22c55e" /><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#4ade80" }}>✅ Access granted! Connecting...</p></div>}
            {permState === "denied" && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#f87171" }}>Camera/Mic access denied</p><p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>Click the 🔒 lock icon in your browser's address bar → Allow camera and microphone.</p><button onClick={() => setPermState("idle")} style={{ marginTop: 10, padding: "7px 14px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Try Again</button></div>}
            {(permState === "idle" || permState === "denied") && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => requestPermAndCall("voice")} style={{ flex: 1, padding: "15px 0", borderRadius: 16, background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 4px 20px rgba(34,197,94,0.45)" }}><Phone size={18} /> Voice Call</button>
                <button onClick={() => requestPermAndCall("video")} style={{ flex: 1, padding: "15px 0", borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 4px 20px rgba(99,102,241,0.45)" }}><Video size={18} /> Video Call</button>
              </div>
            )}
            <p style={{ textAlign: "center", margin: "12px 0 0", fontSize: 11, color: "#475569" }}>₹50 flat for first 5 min · then ₹10/min</p>
          </div>
        </div>
      )}

      {/* Calling Overlay */}
      {showCalling && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "linear-gradient(180deg,#0a0f1e 0%,#0d1117 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "24px 16px" }}>
          <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
          {callType === "video" && <div style={{ display: "flex", gap: 10 }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 200, height: 280, borderRadius: 20, objectFit: "cover", background: "#161b27", border: "2px solid rgba(34,197,94,0.3)" }} />
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: 100, height: 140, borderRadius: 14, objectFit: "cover", background: "#1e2535", border: "2px solid rgba(99,102,241,0.3)" }} />
          </div>}
          <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#22c55e", fontWeight: 700 }}>🟢 Call in Progress</p>
          <img src={chat.avatarUrl} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "3px solid #22c55e" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>{chat.topperName}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{chat.subject}</p>
          </div>
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 50, padding: "6px 22px" }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#4ade80", fontVariantNumeric: "tabular-nums" }}>{fmtTime(callSeconds)}</span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <button onClick={() => setShowEndConfirm(true)} style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(239,68,68,0.6)" }}><PhoneOff size={24} /></button>
          </div>
        </div>
      )}

      {/* End Call Confirm */}
      {showEndConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 480, background: "#13192b", borderRadius: "24px 24px 0 0", padding: "24px 20px 36px" }}>
            <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#f87171" }}>⚠️ End Call?</p>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>Duration: {fmtTime(callSeconds)} · Estimated charge: ₹{callSeconds <= 300 ? 50 : 50 + Math.ceil((callSeconds-300)/60)*10}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowEndConfirm(false)} style={{ flex: 1, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Keep Talking</button>
              <button onClick={confirmEndCall} style={{ flex: 1, padding: 14, borderRadius: 14, background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>End Call</button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRating && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 340, background: "#13192b", borderRadius: 24, padding: 24, textAlign: "center", border: "1px solid rgba(99,102,241,0.2)" }}>
            {ratingSubmitted ? (<>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>Thanks for your feedback! 🎉</p>
            </>) : (<>
              <img src={chat.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", objectPosition: "top", marginBottom: 12 }} />
              <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>How was your session?</p>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>Rate {chat.topperName}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
                {[1,2,3,4,5].map(n => <button key={n} onClick={() => setRatingStars(n)} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", opacity: n <= ratingStars ? 1 : 0.25, transition: "all 0.15s" }}>⭐</button>)}
              </div>
              <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Share your experience (optional)" rows={2} style={{ width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box", background: "#1e2535", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", marginBottom: 12 }} />
              <button onClick={handleSubmitRating} className="btn-primary">Submit Rating</button>
              <button onClick={() => setShowRating(false)} style={{ display: "block", width: "100%", marginTop: 8, background: "none", border: "none", color: "#475569", fontSize: 12, cursor: "pointer" }}>Skip</button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
