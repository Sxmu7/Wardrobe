'use client';
import { useEffect, useState } from 'react';
import { fileToResizedDataUrl } from '../../lib/image';
import { getCurrentProfileId, trySyncPendingProfile } from '../../lib/profile';
import { IconTrash } from '../../components/Icons';
import { useScrollReveal } from '../../lib/useReveal';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

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

  useScrollReveal([photos.length]);

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
        <h1>Community</h1>
        <p>Geteilte Outfits von dir und deinen Freunden.</p>
      </div>

      {error && <div className="banner">{error}</div>}

      {!pendingImage ? (
        <label className="upload-box" style={{ marginBottom: 24 }}>
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          <span className="upload-icon">📸</span>
          + Foto-Outfit teilen
        </label>
      ) : (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-grabber" />
            <h2>Outfit-Foto teilen</h2>
            <img className="preview-img" src={pendingImage} alt="Outfit" />
            <div className="field">
              <label>Notiz</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="z.B. Getragen beim Brunch" />
            </div>
            <div className="row">
              <button className="btn" onClick={() => { setPendingImage(null); setNote(''); }}>Abbrechen</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Speichert...' : 'Teilen'}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="card-sub">Lade...</p>
      ) : photos.length === 0 ? (
        <div className="empty">Noch keine Outfit-Fotos geteilt.</div>
      ) : (
        <div>
          {photos.map((p) => (
            <div key={p.id} className="feed-card reveal">
              <div className="feed-head">
                <span className="friend-avatar" style={{ background: p.avatar_color }}>{p.avatar_emoji}</span>
                <div style={{ flex: 1 }}>
                  <div className="feed-head-name">{p.profile_name}</div>
                  <div className="feed-head-date">{formatDate(p.created_at)}</div>
                </div>
                {p.profile_id === profileId && (
                  <button className="feed-delete-btn" onClick={() => remove(p.id)} aria-label="Loeschen">
                    <IconTrash size={15} />
                  </button>
                )}
              </div>
              <div className="feed-img-wrap">
                <img className="feed-img" src={p.image} alt="Outfit" />
                <button className={'feed-like-overlay' + (p.liked_by_me ? ' liked' : '')} onClick={() => toggleLike(p.id)}>
                  {p.liked_by_me ? '❤️' : '🤍'} {p.like_count}
                </button>
              </div>
              {p.note && <p className="feed-note">{p.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
