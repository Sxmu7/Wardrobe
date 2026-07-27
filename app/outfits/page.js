'use client';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../lib/db';
import { itemsMatch } from '../../lib/color';
import { categoryLabel, SEASON_OPTIONS } from '../../lib/constants';
import { generateOutfit, slotRole } from '../../lib/outfitEngine';
import { compositeOutfitImage } from '../../lib/share';
import { getCurrentProfileId, trySyncPendingProfile } from '../../lib/profile';
import { IconShare, IconCalendar, IconFilter } from '../../components/Icons';
import { useScrollReveal } from '../../lib/useReveal';

export default function OutfitsPage() {
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [seedId, setSeedId] = useState('');
  const [season, setSeason] = useState('alle');
  const [outfit, setOutfit] = useState(null);
  const [outfitName, setOutfitName] = useState('');
  const [wornFlash, setWornFlash] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => { load(); }, []);
  useScrollReveal([items.length, outfit]);

  async function load() {
    const all = await db.getItems();
    setItems(all);
    const o = await db.getOutfits();
    setOutfits(o.sort((a, b) => b.createdAt - a.createdAt));
    if (all.length) setSeedId((prev) => prev || all[0].id);
  }

  const seasonFiltered = useMemo(() => {
    if (season === 'alle') return items;
    return items.filter((i) => !i.season || i.season.length === 0 || i.season.includes(season));
  }, [items, season]);

  const seed = seasonFiltered.find((i) => i.id === seedId) || items.find((i) => i.id === seedId);

  function reroll() {
    if (!seed) return;
    setOutfit(generateOutfit(seed, seasonFiltered));
    setWornFlash(false);
    setShareMsg('');
  }

  useEffect(() => { if (seed) reroll(); /* eslint-disable-next-line */ }, [seedId, season, items.length]);

  function swapSlot(item) {
    if (!outfit) return;
    const candidates = seasonFiltered.filter((i) =>
      i.category === item.category && i.id !== item.id &&
      outfit.items.filter((x) => x.id !== item.id).every((x) => itemsMatch(x, i))
    );
    if (candidates.length === 0) return;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    setOutfit((prev) => ({ ...prev, items: prev.items.map((i) => (i.id === item.id ? next : i)) }));
  }

  async function saveOutfit() {
    if (!outfit) return;
    const rec = {
      id: crypto.randomUUID(),
      name: outfitName || `Outfit mit ${seed.subtype || categoryLabel(seed.category)}`,
      itemIds: outfit.items.map((i) => i.id),
      createdAt: Date.now(),
    };
    await db.addOutfit(rec);
    setOutfits((prev) => [rec, ...prev]);
    setOutfitName('');
  }

  async function markWornToday() {
    if (!outfit) return;
    const updated = outfit.items.map((i) => ({ ...i, wornCount: (i.wornCount || 0) + 1, lastWornAt: Date.now() }));
    await Promise.all(updated.map((i) => db.addItem(i)));
    setItems((prev) => prev.map((i) => updated.find((u) => u.id === i.id) || i));
    setOutfit((prev) => ({ ...prev, items: updated }));
    setWornFlash(true);
    setTimeout(() => setWornFlash(false), 1800);
  }

  async function shareWithFriends() {
    if (!outfit) return;
    setSharing(true);
    setShareMsg('');
    try {
      const synced = await trySyncPendingProfile();
      const profileId = synced ? synced.id : getCurrentProfileId();
      if (!profileId) {
        setShareMsg('Bitte lege zuerst ein Profil an (Tab Profil).');
        setSharing(false);
        return;
      }
      const image = await compositeOutfitImage(outfit.items);
      const res = await fetch('/api/outfit-photos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profileId, image, note: outfitName || `Outfit mit ${seed.subtype || categoryLabel(seed.category)}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Teilen');
      setShareMsg('In der Community geteilt ✓');
    } catch (e) {
      setShareMsg(e.message);
    } finally {
      setSharing(false);
    }
  }

  async function removeOutfit(id) {
    if (!window.confirm('Dieses gespeicherte Outfit wirklich loeschen?')) return;
    await db.deleteOutfit(id);
    setOutfits((prev) => prev.filter((o) => o.id !== id));
  }

  if (items.length === 0) {
    return <div className="empty">Fuege zuerst Kleidungsstuecke in deinem Schrank hinzu.</div>;
  }

  const rows = outfit
    ? { top: outfit.items.filter((i) => slotRole(i.category) === 'top'),
        mid: outfit.items.filter((i) => slotRole(i.category) === 'mid'),
        bottom: outfit.items.filter((i) => slotRole(i.category) === 'bottom') }
    : { top: [], mid: [], bottom: [] };

  return (
    <div>
      <div className="page-header">
        <h1>Kombinieren</h1>
        <p>Waehle ein Teil - wir bauen dir ein Outfit.</p>
      </div>

      {outfit && (
        <div className="top-badge-wrap">
          <span className="top-badge">Top-Match {outfit.score}%</span>
        </div>
      )}

      <div className="outfit-strip" style={{ marginBottom: 16 }}>
        {items.map((i) => (
          <div
            key={i.id}
            onClick={() => setSeedId(i.id)}
            style={{
              flex: 'none', cursor: 'pointer', textAlign: 'center', width: 90,
              opacity: seed && seed.id === i.id ? 1 : 0.55,
            }}
          >
            <img
              src={i.image}
              alt={i.subtype || ''}
              style={{
                width: 90, height: 116, objectFit: 'cover', borderRadius: 10,
                border: seed && seed.id === i.id ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
            />
            <div className="card-sub" style={{ marginTop: 4, justifyContent: 'center' }}>{i.subtype || categoryLabel(i.category)}</div>
          </div>
        ))}
      </div>

      <div className="filter-label"><IconFilter size={14} /> Saison</div>
      <div className="segmented">
        <button type="button" className={season === 'alle' ? 'active' : ''} onClick={() => setSeason('alle')}>Alle</button>
        {SEASON_OPTIONS.map((s) => (
          <button key={s} type="button" className={season === s.toLowerCase() ? 'active' : ''}
            onClick={() => setSeason(s.toLowerCase())}>{s}</button>
        ))}
      </div>

      {outfit && (
        <>
          <div className="moodboard reveal">
            {rows.top.length > 0 && (
              <div className="moodboard-row">
                {rows.top.map((i) => (
                  <div key={i.id} className="moodboard-slot top" onClick={() => swapSlot(i)} title="Antippen zum Tauschen">
                    <img src={i.image} alt={i.subtype || ''} />
                    <span className="moodboard-swap">🔀</span>
                  </div>
                ))}
              </div>
            )}
            {rows.mid.length > 0 && (
              <div className="moodboard-row">
                {rows.mid.map((i) => (
                  <div key={i.id} className="moodboard-slot mid" onClick={() => swapSlot(i)} title="Antippen zum Tauschen">
                    <img src={i.image} alt={i.subtype || ''} />
                    <span className="moodboard-swap">🔀</span>
                  </div>
                ))}
              </div>
            )}
            {rows.bottom.length > 0 && (
              <div className="moodboard-row">
                {rows.bottom.map((i) => (
                  <div key={i.id} className="moodboard-slot bottom" onClick={() => swapSlot(i)} title="Antippen zum Tauschen">
                    <img src={i.image} alt={i.subtype || ''} />
                    <span className="moodboard-swap">🔀</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {outfit.missing.length > 0 && (
            <p className="card-sub" style={{ textAlign: 'center', marginBottom: 12 }}>Fehlt noch: {outfit.missing.join(', ')}</p>
          )}

          <div className="field">
            <input type="text" placeholder="Name fuer dieses Outfit (optional)"
              value={outfitName} onChange={(e) => setOutfitName(e.target.value)} />
          </div>

          <div className="row">
            <button className="btn" onClick={reroll}>🔀 Neu mischen</button>
            <button className="btn btn-primary" onClick={saveOutfit}>Outfit speichern</button>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={markWornToday} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <IconCalendar size={15} /> {wornFlash ? 'Notiert ✓' : 'Heute getragen'}
            </button>
            <button className="btn btn-primary" onClick={shareWithFriends} disabled={sharing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <IconShare size={15} /> {sharing ? 'Teilt...' : 'Mit Freunden teilen'}
            </button>
          </div>
          {shareMsg && <p className="card-sub" style={{ textAlign: 'center', marginTop: 8 }}>{shareMsg}</p>}
        </>
      )}

      {outfits.length > 0 && (
        <div className="section reveal" style={{ marginTop: 24 }}>
          <div className="section-title">Gespeicherte Outfits</div>
          {outfits.map((o) => (
            <div key={o.id} className="outfit-card">
              <div className="outfit-card-head">
                <strong>{o.name}</strong>
                <button className="btn btn-sm btn-danger" onClick={() => removeOutfit(o.id)}>Loeschen</button>
              </div>
              <div className="outfit-strip">
                {o.itemIds.map((id) => {
                  const it = items.find((x) => x.id === id);
                  return it ? <img key={id} src={it.image} title={it.subtype} alt={it.subtype || ''} /> : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
