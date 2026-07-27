import { db } from './db';
import { pushItemRemote, pushOutfitRemote, fetchRemoteItems, fetchRemoteOutfits } from './sync';

// Schiebt alle lokal vorhandenen Items/Outfits einmalig zum Server hoch
// (z.B. direkt nachdem ein Account erstmals verknuepft wurde).
export async function pushAllLocalToRemote() {
  const [items, outfits] = await Promise.all([db.getItems(), db.getOutfits()]);
  await Promise.all([
    ...items.map((i) => pushItemRemote(i)),
    ...outfits.map((o) => pushOutfitRemote(o)),
  ]);
  return { items: items.length, outfits: outfits.length };
}

// Holt alle Items/Outfits eines Accounts vom Server und spiegelt sie in die
// lokale IndexedDB (z.B. beim Einloggen mit Account-Code auf einem neuen Geraet).
export async function pullAllRemoteToLocal(profileId) {
  const [items, outfits] = await Promise.all([fetchRemoteItems(profileId), fetchRemoteOutfits(profileId)]);
  for (const it of items) await db.addItem(it);
  for (const o of outfits) await db.addOutfit(o);
  return { items: items.length, outfits: outfits.length };
}
