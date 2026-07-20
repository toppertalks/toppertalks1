import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import {
  Room,
  RoomEvent,
  Track,
  createLocalTracks,
} from "livekit-client";
import { SignalingClient, joinCall, endCall } from "../lib/rtc.js";

// CallPage handles BOTH outgoing (student initiated) and incoming (mentor joining).
// Route: /call/:sessionId?mode=video|voice
//
// Lifecycle:
//   1. POST /rtc/join  -> get LiveKit token + URL
//   2. Open signaling WS so we know when the other side arrives
//   3. Connect to LiveKit Room, publish local tracks
//   4. Render remote participants
//   5. End -> publish CALL_ENDED + POST /sessions/end + leave room

export default function CallPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const mode = params.get("mode") === "voice" ? "voice" : "video";
  const isVideo = mode === "video";

  const [status, setStatus] = useState("connecting"); // connecting | ringing | live | ended | error
  const [otherJoined, setOtherJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(isVideo);
  const [error, setError] = useState(null);
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [elapsed, setElapsed] = useState(0);

  const roomRef = useRef(null);
  const sigRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map()); // sid -> videoEl
  const startedAtRef = useRef(null);

  // --- Setup -------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let room;

    async function start() {
      try {
        // 1. Ask backend for a LiveKit token.
        const join = await joinCall(sessionId);
        if (cancelled) return;

        // 2. Open signaling for presence + accept/reject/end events.
        const sig = new SignalingClient(sessionId);
        sigRef.current = sig;
        sig.on("ROOM_STATE", (m) => {
          if (m.participants?.length) setOtherJoined(true);
        });
        sig.on("STUDENT_JOINED", () => setOtherJoined(true));
        sig.on("MENTOR_JOINED", () => setOtherJoined(true));
        sig.on("CALL_ENDED", () => leave(true));
        sig.connect();

        // 3. If LiveKit isn't configured yet, stay in "ringing" UI so the
        //    student still sees the call screen and signaling still works.
        if (!join.livekitToken || !join.livekitUrl) {
          setStatus("ringing");
          return;
        }

        // 4. Connect to LiveKit room.
        room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.ParticipantConnected, (p) => {
          setOtherJoined(true);
          setRemoteParticipants((arr) => [...arr.filter((x) => x.sid !== p.sid), p]);
        });
        room.on(RoomEvent.ParticipantDisconnected, (p) => {
          setRemoteParticipants((arr) => arr.filter((x) => x.sid !== p.sid));
        });
        room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          if (track.kind === Track.Kind.Video) {
            const el = remoteVideoRefs.current.get(participant.sid);
            if (el) track.attach(el);
          } else if (track.kind === Track.Kind.Audio) {
            track.attach(); // appends a hidden <audio> automatically
          }
          setRemoteParticipants((arr) => [...arr]); // re-render
        });
        room.on(RoomEvent.Disconnected, () => setStatus("ended"));

        await room.connect(join.livekitUrl, join.livekitToken);

        // 5. Publish local tracks.
        const tracks = await createLocalTracks({
          audio: true,
          video: isVideo,
        });
        for (const t of tracks) {
          await room.localParticipant.publishTrack(t);
          if (t.kind === Track.Kind.Video && localVideoRef.current) {
            t.attach(localVideoRef.current);
          }
        }

        // Catch participants already in the room (race).
        room.remoteParticipants.forEach((p) => {
          setRemoteParticipants((arr) => [...arr.filter((x) => x.sid !== p.sid), p]);
          setOtherJoined(true);
        });

        setStatus("live");
        startedAtRef.current = Date.now();
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e?.response?.data?.detail || e.message || "Call failed");
          setStatus("error");
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      leave(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // --- Elapsed timer -----------------------------------------------------
  useEffect(() => {
    if (status !== "live") return;
    const id = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  // --- Controls ----------------------------------------------------------
  function toggleMic() {
    const lp = roomRef.current?.localParticipant;
    if (!lp) return;
    const next = !micOn;
    lp.setMicrophoneEnabled(next);
    setMicOn(next);
  }
  function toggleCam() {
    if (!isVideo) return;
    const lp = roomRef.current?.localParticipant;
    if (!lp) return;
    const next = !camOn;
    lp.setCameraEnabled(next);
    setCamOn(next);
  }
  async function leave(announce) {
    try {
      if (announce && sigRef.current) {
        sigRef.current.send({ type: "CALL_ENDED" });
      }
    } catch {}
    try { sigRef.current?.close(); } catch {}
    try { await roomRef.current?.disconnect(); } catch {}
    try { await endCall(sessionId); } catch {}
    sigRef.current = null;
    roomRef.current = null;
    setStatus("ended");
  }
  function handleHangup() {
    leave(true).finally(() => navigate(-1));
  }

  // --- Render ------------------------------------------------------------
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.6)" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{isVideo ? "Video Call" : "Voice Call"}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {status === "connecting" && "Connecting…"}
            {status === "ringing" && (otherJoined ? "Other side joined" : "Ringing…")}
            {status === "live" && mmss}
            {status === "ended" && "Call ended"}
            {status === "error" && (error || "Error")}
          </div>
        </div>
        <div style={{ fontSize: 11, color: otherJoined ? "#4ade80" : "#fbbf24" }}>
          {otherJoined ? "● Connected" : "○ Waiting"}
        </div>
      </div>

      {/* Video stage */}
      <div style={{ flex: 1, position: "relative", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {status === "connecting" && (
          <div style={{ textAlign: "center" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>Setting up your call…</p>
          </div>
        )}
        {status === "error" && (
          <div style={{ textAlign: "center", padding: 24 }}>
            <p style={{ color: "#f87171", fontWeight: 700 }}>{error}</p>
            <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: "10px 18px", borderRadius: 12, background: "#1f2937", color: "#fff", border: "1px solid #374151", cursor: "pointer" }}>Go back</button>
          </div>
        )}

        {/* Remote tiles */}
        {isVideo && remoteParticipants.map((p) => (
          <video
            key={p.sid}
            autoPlay
            playsInline
            ref={(el) => {
              if (el) {
                remoteVideoRefs.current.set(p.sid, el);
                // Attach already-subscribed video tracks
                p.videoTrackPublications.forEach((pub) => {
                  if (pub.track) pub.track.attach(el);
                });
              } else {
                remoteVideoRefs.current.delete(p.sid);
              }
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          />
        ))}

        {/* Voice-only avatar */}
        {!isVideo && status !== "connecting" && status !== "error" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
              <Mic size={48} />
            </div>
            <p style={{ marginTop: 18, fontSize: 14, color: "#cbd5e1" }}>
              {otherJoined ? "In call" : "Waiting for the other side…"}
            </p>
          </div>
        )}

        {/* Local self-view (PIP) */}
        {isVideo && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ position: "absolute", bottom: 16, right: 16, width: 110, height: 150, objectFit: "cover", borderRadius: 12, border: "2px solid rgba(255,255,255,0.15)", background: "#111" }}
          />
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: 22, display: "flex", justifyContent: "center", gap: 18, background: "rgba(0,0,0,0.7)" }}>
        <button onClick={toggleMic} title="Toggle mic"
          style={ctrlStyle(micOn ? "#1f2937" : "#dc2626")}>
          {micOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>

        {isVideo && (
          <button onClick={toggleCam} title="Toggle camera"
            style={ctrlStyle(camOn ? "#1f2937" : "#dc2626")}>
            {camOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        )}

        <button onClick={handleHangup} title="End call"
          style={ctrlStyle("#dc2626", 68)}>
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}

function ctrlStyle(bg, size = 56) {
  return {
    width: size, height: size, borderRadius: "50%", background: bg,
    color: "#fff", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
  };
}
