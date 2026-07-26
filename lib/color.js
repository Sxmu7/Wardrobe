export function getDominantColor(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const size = 40;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      let data;
      try { data = ctx.getImageData(0, 0, size, size).data; } catch (e) { reject(e); return; }
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 100) continue;
        const rr = data[i], gg = data[i + 1], bb = data[i + 2];
        if (rr > 245 && gg > 245 && bb > 245) continue;
        r += rr; g += gg; b += bb; n++;
      }
      if (n === 0) { r = 200; g = 200; b = 200; n = 1; }
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      resolve({ r, g, b, hex: rgbToHex(r, g, b) });
    };
    img.src = dataUrl;
  });
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex) {
  const m = (hex || '#888888').replace('#', '').trim();
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const bigint = parseInt(full || '888888', 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function classifyColor(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l > 0.9) return { family: 'weiss', label: 'Weiss', isNeutral: true, hue: h };
  if (l < 0.14) return { family: 'schwarz', label: 'Schwarz', isNeutral: true, hue: h };
  if (s < 0.14) return { family: 'grau', label: 'Grau', isNeutral: true, hue: h };
  if (h >= 15 && h <= 55 && s < 0.55 && l > 0.22 && l < 0.78) {
    return l > 0.55
      ? { family: 'beige', label: 'Beige', isNeutral: true, hue: h }
      : { family: 'braun', label: 'Braun', isNeutral: true, hue: h };
  }
  if (h >= 195 && h <= 250 && l < 0.32) return { family: 'navy', label: 'Navy', isNeutral: true, hue: h };
  if (h < 15 || h >= 345) return { family: 'rot', label: 'Rot', isNeutral: false, hue: h };
  if (h < 45) return { family: 'orange', label: 'Orange', isNeutral: false, hue: h };
  if (h < 70) return { family: 'gelb', label: 'Gelb', isNeutral: false, hue: h };
  if (h < 170) return { family: 'gruen', label: 'Gruen', isNeutral: false, hue: h };
  if (h < 255) return { family: 'blau', label: 'Blau', isNeutral: false, hue: h };
  if (h < 290) return { family: 'lila', label: 'Lila', isNeutral: false, hue: h };
  return { family: 'pink', label: 'Pink', isNeutral: false, hue: h };
}

export function itemsMatch(a, b) {
  if (!a || !b) return false;
  if (a.isNeutral || b.isNeutral) return true;
  if (a.colorFamily === b.colorFamily) return true;
  const diff = Math.min(Math.abs(a.colorHue - b.colorHue), 360 - Math.abs(a.colorHue - b.colorHue));
  return diff <= 45;
}

export function isBoldPair(a, b) {
  if (!a || !b || a.isNeutral || b.isNeutral) return false;
  const diff = Math.min(Math.abs(a.colorHue - b.colorHue), 360 - Math.abs(a.colorHue - b.colorHue));
  return diff >= 150 && diff <= 210;
}
