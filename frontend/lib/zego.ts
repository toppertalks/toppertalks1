/**
 * TopperTalks — Zegocloud integration utility
 * Handles real voice + video calls using Zegocloud Express Web SDK
 */

export const ZEGO_APP_ID = 83813256;
export const ZEGO_APP_SIGN = "a3c25cded4c5393585178f94846e41345519f33d6ae85a30f4a332e6c89d98ab";
export const ZEGO_SERVER = "wss://webliveroom83813256-api.imzego.com/ws";

/** Room ID shared between student and topper for the same conversation */
export function getRoomID(conversationId: string): string {
    return `tt_${conversationId}`;
}

/** Unique stream ID for each participant */
export function getStreamID(roomID: string, role: "student" | "topper"): string {
    return `${roomID}_${role}_${Date.now()}`;
}

/** A simple numeric userID for Zegocloud (must be unique per user) */
export function getStudentUserID(): string {
    const stored = typeof window !== "undefined" && sessionStorage.getItem("tt_student_uid");
    if (stored) return stored;
    const uid = `s_${Math.floor(Math.random() * 999999)}`;
    if (typeof window !== "undefined") sessionStorage.setItem("tt_student_uid", uid);
    return uid;
}

export function getTopperUserID(): string {
    return "topper_ananya_83813256"; // Fixed topper ID in demo
}

/**
 * Starts a Zegocloud call session.
 * Must be called only in browser (inside useEffect).
 * Returns { zg, localStream, streamID } for cleanup.
 */
export async function startZegoCall(params: {
    conversationId: string;
    role: "student" | "topper";
    isVideo: boolean;
    localVideoEl?: HTMLVideoElement | null;
    remoteAudioEl?: HTMLAudioElement | null;
    remoteVideoEl?: HTMLVideoElement | null;
    onRemoteUserJoined?: () => void;
}) {
    const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");

    const roomID = getRoomID(params.conversationId);
    const userID = params.role === "student" ? getStudentUserID() : getTopperUserID();
    const userName = params.role === "student" ? "Student" : "Ananya (Topper)";
    const streamID = getStreamID(roomID, params.role);

    // Initialize engine (singleton pattern — safe to re-create)
    const zg = new ZegoExpressEngine(ZEGO_APP_ID, ZEGO_SERVER);

    // Use AppSign directly as token (AppSign authentication mode — perfect for dev/MVP)
    await zg.loginRoom(
        roomID,
        ZEGO_APP_SIGN,
        { userID, userName },
        { userUpdate: true }
    );

    // Create local media stream
    const localStream = await zg.createStream({
        camera: {
            audio: true,
            video: params.isVideo,
        },
    });

    // Show local video preview (for video calls)
    if (params.isVideo && params.localVideoEl) {
        params.localVideoEl.srcObject = localStream;
        params.localVideoEl.play().catch(() => { });
    }

    // Publish our stream to the room
    await zg.startPublishingStream(streamID, localStream);

    // Listen for remote participant's stream
    zg.on("roomStreamUpdate", async (_roomID: string, updateType: string, streamList: { streamID: string }[]) => {
        if (updateType === "ADD" && streamList.length > 0) {
            params.onRemoteUserJoined?.();
            const remoteStream = await zg.startPlayingStream(streamList[0].streamID) as MediaStream;

            // Play remote audio
            if (params.remoteAudioEl) {
                params.remoteAudioEl.srcObject = remoteStream;
                params.remoteAudioEl.play().catch(() => { });
            }
            // Show remote video
            if (params.isVideo && params.remoteVideoEl) {
                params.remoteVideoEl.srcObject = remoteStream;
                params.remoteVideoEl.play().catch(() => { });
            }
        }
    });

    return { zg, localStream, streamID, roomID };
}

/**
 * Cleanly ends a Zegocloud session.
 */
export async function stopZegoCall(session: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zg: any;
    localStream: MediaStream | null;
    streamID: string;
    roomID: string;
}) {
    try {
        await session.zg.stopPublishingStream(session.streamID);
        if (session.localStream) session.zg.destroyStream(session.localStream);
        await session.zg.logoutRoom(session.roomID);
    } catch (e) {
        console.warn("Zegocloud cleanup error (safe to ignore):", e);
    }
}
