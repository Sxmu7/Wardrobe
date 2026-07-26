'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { fileToResizedDataUrl } from '../../lib/image';

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [items, setItems] = useState([]);
  const [pendingImage, setPendingImage] = useState(null);
  const [note, setNote] = useState('');
  const [linked, setLinked] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setPhotos((await db.getPhotos()).sort((a, b) => b.createdAt - a.createdAt));
    setItems(await db.getItems());
  }

  async function handleFile(file) {
    const dataUrl = await fileToResizedDataUrl(file, 1200);
    setPendingImage(dataUrl);
  }

  function toggleLink(id) {
    setLinked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function save() {
    const photo = { id: crypto.randomUUID(), image: pendingImage, note, linkedItemIds: linked, createdAt: Date.now() };
    await db.addPhoto(photo);
    setPhotos((prev) => [photo, ...prev]);
    setPendingImage(null); setNote(''); setLinked([]);
  }

  async function remove(id) {
    await db.deletePhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Outfit-Fotos</h1>
          <p>Speichere echte Fotos deiner kombinierten Outfits.</p>
        </div>
      </div>

      {!pendingImage ? (
        <label className="upload-drop" style={{ display: 'block', marginBottom: 24 }}>
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          Outfit-Foto hochladen
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
            <div className="field">
              <label>Verwendete Teile verlinken (optional)</label>
              <div className="chip-group">
                {items.map((i) => (
                  <span key={i.id} className={'chip' + (linked.includes(i.id) ? ' selected' : '')} onClick={() => toggleLink(i.id)}>
                    {i.subtype || i.category}
                  </span>
                ))}
              </div>
            </div>
            <div className="row">
              <button className="btn" onClick={() => { setPendingImage(null); setNote(''); setLinked([]); }}>Abbrechen</button>
              <button className="btn btn-primary" onClick={save}>Speichern</button>
            </div>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="empty">Noch keine Outfit-Fotos gespeichert.</div>
      ) : (
        <div className="grid">
          {photos.map((p) => (
            <div key={p.id} className="card" onClick={() => {}}>
              <img src={p.image} alt="Outfit" />
              <div className="card-body">
                {p.note && <p className="card-sub">{p.note}</p>}
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); remove(p.id); }}>Loeschen</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
