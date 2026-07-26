export const CATEGORIES = [
  { key: 'oberteil', label: 'Oberteil', icon: '👕' },
  { key: 'hose', label: 'Hose', icon: '👖' },
  { key: 'rock', label: 'Rock', icon: '👗' },
  { key: 'kleid', label: 'Kleid', icon: '👗' },
  { key: 'jacke', label: 'Jacke / Mantel', icon: '🧥' },
  { key: 'schuhe', label: 'Schuhe', icon: '👟' },
  { key: 'accessoire', label: 'Accessoire', icon: '🧣' },
  { key: 'tasche', label: 'Tasche', icon: '👜' },
  { key: 'sonstiges', label: 'Sonstiges', icon: '✨' },
];

export const FIT_OPTIONS = ['Slim', 'Regular', 'Oversized', 'Tailliert', 'Weit', 'Unbekannt'];
export const PATTERN_OPTIONS = ['Uni', 'Gestreift', 'Kariert', 'Geblumt', 'Bedruckt', 'Sonstiges'];
export const SEASON_OPTIONS = ['Fruehling', 'Sommer', 'Herbst', 'Winter'];

export const COLOR_SWATCHES = [
  { family: 'schwarz', label: 'Schwarz', hex: '#1a1a1a', isNeutral: true, hue: 0 },
  { family: 'weiss', label: 'Weiss', hex: '#f5f5f3', isNeutral: true, hue: 0 },
  { family: 'grau', label: 'Grau', hex: '#9b9b9b', isNeutral: true, hue: 0 },
  { family: 'beige', label: 'Beige', hex: '#d8c3a0', isNeutral: true, hue: 35 },
  { family: 'braun', label: 'Braun', hex: '#6b4a30', isNeutral: true, hue: 30 },
  { family: 'navy', label: 'Navy', hex: '#1f2b4d', isNeutral: true, hue: 220 },
  { family: 'rot', label: 'Rot', hex: '#b23a3a', isNeutral: false, hue: 0 },
  { family: 'orange', label: 'Orange', hex: '#d3792f', isNeutral: false, hue: 30 },
  { family: 'gelb', label: 'Gelb', hex: '#d9b93c', isNeutral: false, hue: 55 },
  { family: 'gruen', label: 'Gruen', hex: '#4c7a4c', isNeutral: false, hue: 120 },
  { family: 'blau', label: 'Blau', hex: '#3a6ea5', isNeutral: false, hue: 210 },
  { family: 'lila', label: 'Lila', hex: '#7a5aa5', isNeutral: false, hue: 270 },
  { family: 'pink', label: 'Pink', hex: '#c96f95', isNeutral: false, hue: 320 },
];

export function findSwatchByFamily(family) {
  return COLOR_SWATCHES.find((s) => s.family === family) || COLOR_SWATCHES[2];
}

export function categoryLabel(key) {
  const c = CATEGORIES.find((c) => c.key === key);
  return c ? c.label : key;
}

export function categoryIcon(key) {
  const c = CATEGORIES.find((c) => c.key === key);
  return c ? c.icon : '✨';
}
