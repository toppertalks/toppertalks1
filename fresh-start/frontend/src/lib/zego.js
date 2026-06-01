// Lightweight stub for the Zego real-time-calling lib that the legacy
// frontend depended on. We keep the call signatures so ported pages
// continue to work, but render a placeholder instead of connecting to
// the Zego service. Replace with the real SDK when RTC is re-introduced.

export async function startZegoCall(_opts = {}) {
  console.warn('[zego stub] startZegoCall called', _opts);
  return { ok: false, stub: true };
}

export async function stopZegoCall() {
  console.warn('[zego stub] stopZegoCall called');
  return { ok: true, stub: true };
}
