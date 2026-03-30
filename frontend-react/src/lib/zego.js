export const ZEGO_APP_ID = 83813256;
export const ZEGO_APP_SIGN = "a3c25cded4c5393585178f94846e41345519f33d6ae85a30f4a332e6c89d98ab";
export const ZEGO_SERVER = "wss://webliveroom83813256-api.imzego.com/ws";

export function getRoomID(conversationId) {
  return `tt_${conversationId}`;
}

export function getStreamID(roomID, role) {
  return `${roomID}_${role}_${Date.now()}`;
}

export function getStudentUserID() {
  const stored = sessionStorage.getItem("tt_student_uid");
  if (stored) return stored;
  const uid = `s_${Math.floor(Math.random() * 999999)}`;
  sessionStorage.setItem("tt_student_uid", uid);
  return uid;
}

export function getTopperUserID() {
  return "topper_ananya_83813256";
}

export async function startZegoCall(params) {
  const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");

  const roomID = getRoomID(params.conversationId);
  const userID = params.role === "student" ? getStudentUserID() : getTopperUserID();
  const userName = params.role === "student" ? "Student" : "Ananya (Topper)";
  const streamID = getStreamID(roomID, params.role);

  const zg = new ZegoExpressEngine(ZEGO_APP_ID, ZEGO_SERVER);

  await zg.loginRoom(roomID, ZEGO_APP_SIGN, { userID, userName }, { userUpdate: true });

  const localStream = await zg.createStream({
    camera: { audio: true, video: params.isVideo },
  });

  if (params.isVideo && params.localVideoEl) {
    params.localVideoEl.srcObject = localStream;
    params.localVideoEl.play().catch(() => {});
  }

  await zg.startPublishingStream(streamID, localStream);

  zg.on("roomStreamUpdate", async (_roomID, updateType, streamList) => {
    if (updateType === "ADD" && streamList.length > 0) {
      params.onRemoteUserJoined?.();
      const remoteStream = await zg.startPlayingStream(streamList[0].streamID);

      if (params.remoteAudioEl) {
        params.remoteAudioEl.srcObject = remoteStream;
        params.remoteAudioEl.play().catch(() => {});
      }
      if (params.isVideo && params.remoteVideoEl) {
        params.remoteVideoEl.srcObject = remoteStream;
        params.remoteVideoEl.play().catch(() => {});
      }
    }
  });

  return { zg, localStream, streamID, roomID };
}

export async function stopZegoCall(session) {
  try {
    await session.zg.stopPublishingStream(session.streamID);
    if (session.localStream) session.zg.destroyStream(session.localStream);
    await session.zg.logoutRoom(session.roomID);
  } catch (e) {
    console.warn("Zegocloud cleanup error (safe to ignore):", e);
  }
}
