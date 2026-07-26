export const CATEGORIES = [
  { key: 'oberteil', label: 'Oberteil' },
  { key: 'hose', label: 'Hose' },
  { key: 'rock', label: 'Rock' },
  { key: 'kleid', label: 'Kleid' },
  { key: 'jacke', label: 'Jacke / Mantel' },
  { key: 'schuhe', label: 'Schuhe' },
  { key: 'accessoire', label: 'Accessoire' },
  { key: 'tasche', label: 'Tasche' },
  { key: 'sonstiges', label: 'Sonstiges' },
];

export const FIT_OPTIONS = ['Slim', 'Regular', 'Oversized', 'Tailliert', 'Weit', 'Unbekannt'];
export const PATTERN_OPTIONS = ['Uni', 'Gestreift', 'Kariert', 'Geblumt', 'Bedruckt', 'Sonstiges'];
export const SEASON_OPTIONS = ['Fruehling', 'Sommer', 'Herbst', 'Winter'];

export function categoryLabel(key) {
  const c = CATEGORIES.find((c) => c.key === key);
  return c ? c.label : key;
}
