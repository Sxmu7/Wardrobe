'use client';
import { useEffect, useState } from 'react';
import { fileToResizedDataUrl } from '../../lib/image';
import { getCurrentProfileId, trySyncPendingProfile } from '../../lib/profile';

export default function GalleryPage() {
  const [profileId, setProfileId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingImage, setPendingImage] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const synced = await trySyncPendingProfile();
      const id = synced ? synced.id : getCurrentProfileId();
      setProfileId(id);
      if (id) load(id); else setLoading(false);
    })();
  }, []);

  async function load(id) {
    setLoading(true);
    try {
      const res = await fetch('/api/outfit-photos?profileId=' + id);
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (e) {
      setError('Konnte Outfit-Fotos nicht laden.');
    }
    setLoading(false);
  }

  async function handleFile(file) {
    const dataUrl = await fileToResizedDataUrl(file, 1200);
    setPendingImage(dataUrl);
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/outfit-photos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profileId, image: pendingImage, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern');
      setPendingImage(null);
      setNote('');
      await load(profileId);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleLike(photoId) {
    setPhotos((prev) => prev.map((p) => p.id === photoId
      ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.like_count + (p.liked_by_me ? -1 : 1) }
      : p));
    try {
      await fetch('/api/outfit-photos/like', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ outfitPhotoId: photoId, profileId }),
      });
    } catch (e) {
      load(profileId);
    }
  }

  async function remove(photoId) {
    if (!window.confirm('Dieses Outfit-Foto wirklich loeschen?')) return;
    try {
      await fetch('/api/outfit-photos', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: photoId, profileId }),
      });
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (e) {}
  }

  if (!profileId) {
    return (
      <div className="empty">
        Bitte lege zuerst ein Profil an, um Outfit-Fotos zu teilen. <br />
        <a href="/profil" className="btn btn-primary" style={{ marginTop: 14, display: 'inline-flex' }}>Zum Profil</a>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Outfits</h1>
        <p>Geteilte Outfit-Fotos von dir und deinen Freunden.</p>
      </div>

      {error && <div className="banner">{error}</div>}

      {!pendingImage ? (
        <label className="upload-box" style={{ marginBottom: 24 }}>
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          <span className="upload-icon">📸</span>
          + Foto-Outfit speichern
        </label>
      ) : (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Outfit-Foto speichern</h2>
            <img className="preview-img" src={pendingImage} alt="Outfit" />
            <div className="field">
              <label>Notiz</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="z.B. Getragen beim Brunch" />
            </div>
            <div className="row">
              <button className="btn" onClick={() => { setPendingImage(null); setNote(''); }}>Abbrechen</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Speichert...' : 'Speichern'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="section-label">Von Freunden</div>
      {loading ? (
        <p className="card-sub">Lade...</p>
      ) : photos.length === 0 ? (
        <div className="empty">Noch keine Outfit-Fotos gespeichert.</div>
      ) : (
        <div className="grid-2">
          {photos.map((p) => (
            <div key={p.id} className="card" style={{ cursor: 'default' }}>
              <img src={p.image} alt="Outfit" />
              <div className="card-body">
                <div className="friend-head">
                  <span className="friend-avatar" style={{ background: p.avatar_color }}>{p.avatar_emoji}</span>
                  <span className="friend-name">{p.profile_name}</span>
                </div>
                {p.note && <p className="card-sub" style={{ marginBottom: 6 }}>{p.note}</p>}
                <button className={'like-btn' + (p.liked_by_me ? ' liked' : '')} onClick={() => toggleLike(p.id)}>
                  {p.liked_by_me ? '❤️' : '🤍'} {p.like_count}
                </button>
                {p.profile_id === profileId && (
                  <button className="btn btn-sm btn-danger" style={{ marginTop: 8 }} onClick={() => remove(p.id)}>Loeschen</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
