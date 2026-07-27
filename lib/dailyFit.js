// "Fit fuer heute"-Baukasten: schlaegt taeglich, Kategorie fuer Kategorie, je 2 Teile vor.
// Reihenfolge: Oberteil -> Jacke/Layer -> Hose/Rock -> Schuhe -> Accessoires.
import { itemsMatch } from './color';

const STORAGE_KEY = 'kleiderschrank_today_fit';

export const FIT_SLOTS = [
  { key: 'oberteil', label: 'Oberteil', categories: ['oberteil', 'kleid'] },
  { key: 'jacke', label: 'Jacke / Layer', categories: ['jacke'] },
  { key: 'hose', label: 'Hose', categories: ['hose', 'rock'] },
  { key: 'schuhe', label: 'Schuhe', categories: ['schuhe'] },
  { key: 'accessoire', label: 'Accessoires', categories: ['accessoire', 'tasche', 'sonstiges'] },
];

export function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Deterministischer PRNG aus einem String-Seed (mulberry-artig) - gleiche Vorschlaege
// den ganzen Tag ueber, aber neu gemischt sobald sich der Seed (Tag / Reroll) aendert.
function seededRand(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function seededShuffle(array, seedStr) {
  const rand = seededRand(seedStr);
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function loadTodayFit() {
  if (typeof window === 'undefined') return { date: todayDateKey(), picks: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === todayDateKey() && parsed.picks) return parsed;
    }
  } catch (e) { /* ignore */ }
  return { date: todayDateKey(), picks: {} };
}

export function saveTodayFit(state) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

export function resetTodayFit() {
  const fresh = { date: todayDateKey(), picks: {} };
  saveTodayFit(fresh);
  return fresh;
}

export function slotForCategory(category) {
  return FIT_SLOTS.find((s) => s.categories.includes(category)) || null;
}

export function candidatesForSlot(items, slot, picks) {
  const pickedIds = new Set(Object.values(picks || {}).filter((v) => v && v !== 'skip'));
  return items.filter((i) => slot.categories.includes(i.category) && !pickedIds.has(i.id));
}

// Naechster noch offener Slot (nicht ausgewaehlt/uebersprungen und mit verfuegbaren Teilen).
export function nextOpenSlot(items, picks) {
  for (const slot of FIT_SLOTS) {
    if (picks[slot.key]) continue;
    if (candidatesForSlot(items, slot, picks).length > 0) return slot;
  }
  return null;
}

export function pickedItemsList(items, picks) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const list = [];
  for (const slot of FIT_SLOTS) {
    const id = picks[slot.key];
    if (id && id !== 'skip' && byId.has(id)) list.push(byId.get(id));
  }
  return list;
}

// Schlaegt bis zu 2 Teile fuer einen Slot vor - bevorzugt Teile, die farblich zu den
// bereits gewaehlten Stuecken passen (nutzt die bestehende itemsMatch-Logik).
export function suggestionsForSlot(items, slot, picks, chosenItems, nonce) {
  const candidates = candidatesForSlot(items, slot, picks);
  if (candidates.length === 0) return [];
  let pool = candidates;
  if (chosenItems.length > 0) {
    const matching = candidates.filter((c) => chosenItems.every((ch) => itemsMatch(c, ch)));
    if (matching.length > 0) pool = matching;
  }
  const seed = todayDateKey() + ':' + slot.key + ':' + (nonce || 0);
  return seededShuffle(pool, seed).slice(0, 2);
}
