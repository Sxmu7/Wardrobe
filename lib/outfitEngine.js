import { itemsMatch } from './color';

export function getSlotsForSeed(seedCategory) {
  const isKleid = seedCategory === 'kleid';
  const needsTop = !isKleid && seedCategory !== 'oberteil';
  const needsBottom = !isKleid && ['hose', 'rock'].indexOf(seedCategory) === -1;
  const slots = [];
  if (needsTop) slots.push({ key: 'oberteil', label: 'Oberteil', match: ['oberteil'], required: true });
  if (needsBottom) slots.push({ key: 'unterteil', label: 'Hose/Rock', match: ['hose', 'rock'], required: true });
  if (seedCategory !== 'schuhe') slots.push({ key: 'schuhe', label: 'Schuhe', match: ['schuhe'], required: true });
  if (seedCategory !== 'jacke') slots.push({ key: 'jacke', label: 'Jacke', match: ['jacke'], required: false });
  if (['accessoire', 'tasche'].indexOf(seedCategory) === -1) slots.push({ key: 'accessoire', label: 'Accessoire/Tasche', match: ['accessoire', 'tasche'], required: false });
  return slots;
}

export function pickForSlot(candidates, chosenSoFar) {
  if (candidates.length === 0) return null;
  const strict = candidates.filter((c) => chosenSoFar.every((ch) => itemsMatch(c, ch)));
  const pool = strict.length ? strict : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateOutfit(seed, allItems) {
  const slots = getSlotsForSeed(seed.category);
  let chosen = [seed];
  const missing = [];
  for (const slot of slots) {
    const candidates = allItems.filter((i) => slot.match.indexOf(i.category) !== -1 && i.id !== seed.id && itemsMatch(seed, i));
    const pick = pickForSlot(candidates, chosen);
    if (pick) chosen.push(pick); else if (slot.required) missing.push(slot.label);
  }
  const totalSlots = slots.length + 1;
  const filled = chosen.length;
  const allSameFamilyOrNeutral = chosen.every((i) => i.isNeutral || i.colorFamily === seed.colorFamily);
  const score = Math.min(99, Math.round(58 + (filled / totalSlots) * 32 + (allSameFamilyOrNeutral ? 9 : 0)));
  return { items: chosen, missing, score };
}

// Bestimmt die Slot-Rolle eines Items (fuer Moodboard-Layout: top/mid/bottom)
export function slotRole(category) {
  if (['oberteil', 'kleid'].includes(category)) return 'top';
  if (['hose', 'rock', 'schuhe'].includes(category)) return 'mid';
  return 'bottom';
}
