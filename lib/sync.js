// Best-effort Hintergrund-Sync von Items/Outfits zum Server, damit ein Account
// (Profil-ID) auf mehreren Geraeten den gleichen Schrank sieht. Faellt lautlos
// zurueck, wenn kein Profil verknuepft oder kein Netzwerk verfuegbar ist -
// die App bleibt dadurch immer voll offline-nutzbar.
import { getCurrentProfileId } from './profile';

export async function pushItemRemote(item) {
  const profileId = getCurrentProfileId();
  if (!profileId) return;
  try {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profileId, item }),
    });
  } catch (e) {}
}

export async function deleteItemRemote(id) {
  const profileId = getCurrentProfileId();
  if (!profileId) return;
  try {
    await fetch('/api/items', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, profileId }),
    });
  } catch (e) {}
}

export async function pushOutfitRemote(outfit) {
  const profileId = getCurrentProfileId();
  if (!profileId) return;
  try {
    await fetch('/api/outfits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ profileId, outfit }),
    });
  } catch (e) {}
}

export async function deleteOutfitRemote(id) {
  const profileId = getCurrentProfileId();
  if (!profileId) return;
  try {
    await fetch('/api/outfits', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, profileId }),
    });
  } catch (e) {}
}

export async function fetchRemoteItems(profileId) {
  const res = await fetch('/api/items?profileId=' + profileId);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sync fehlgeschlagen');
  return data.items || [];
}

export async function fetchRemoteOutfits(profileId) {
  const res = await fetch('/api/outfits?profileId=' + profileId);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sync fehlgeschlagen');
  return data.outfits || [];
}

export async function lookupProfileByCode(code) {
  const res = await fetch('/api/profiles?id=' + encodeURIComponent(code));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Account nicht gefunden');
  return data.profile;
}
