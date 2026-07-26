const PROFILE_ID_KEY = 'kleiderschrank_profile_id';
const PROFILE_NAME_KEY = 'kleiderschrank_profile_name';
const PENDING_KEY = 'kleiderschrank_profile_pending';

export function getCurrentProfileId() {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(PROFILE_ID_KEY);
  return v ? parseInt(v, 10) : null;
}

export function setCurrentProfile(id, name) {
  if (typeof window === 'undefined') return;
  if (id === null || id === undefined) {
    localStorage.removeItem(PROFILE_ID_KEY);
  } else {
    localStorage.setItem(PROFILE_ID_KEY, String(id));
    localStorage.removeItem(PENDING_KEY);
  }
  if (name) localStorage.setItem(PROFILE_NAME_KEY, name);
}

export function getCurrentProfileName() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(PROFILE_NAME_KEY) || '';
}

export function hasPendingProfile() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PENDING_KEY) === '1' && !getCurrentProfileId();
}

export async function fetchProfiles() {
  const res = await fetch('/api/profiles');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Konnte Profile nicht laden');
  return data.profiles;
}

export async function createProfileRemote(name) {
  const res = await fetch('/api/profiles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Konnte Profil nicht erstellen');
  return data.profile;
}

// Versucht, ein lokal angelegtes (noch nicht synchronisiertes) Profil
// nachtraeglich in der Datenbank anzulegen, sobald diese erreichbar ist.
export async function trySyncPendingProfile() {
  if (typeof window === 'undefined') return null;
  if (!hasPendingProfile()) return null;
  const name = getCurrentProfileName();
  if (!name) return null;
  try {
    const profile = await createProfileRemote(name);
    setCurrentProfile(profile.id, profile.name);
    return profile;
  } catch (e) {
    return null;
  }
}
