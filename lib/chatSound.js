// Kurze, synthetisierte Chat-Sounds (Web Audio API) im WhatsApp-Stil -
// kein Audio-Asset noetig, funktioniert komplett offline und ohne Download.

let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch (e) {
    return null;
  }
}

function tone(freq, duration, startGain, delay) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t0 = c.currentTime + (delay || 0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(startGain, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  } catch (e) {}
}

// Eingehende Bot-Nachricht: kurzer, zweitoeniger heller "Pop" (aufsteigend).
export function playReceive() {
  tone(760, 0.1, 0.11, 0);
  tone(1080, 0.1, 0.09, 0.055);
}

// Gesendete Nutzer-Nachricht: einzelner, etwas tieferer "Blip".
export function playSend() {
  tone(520, 0.08, 0.1, 0);
}
