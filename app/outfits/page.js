'use client';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../lib/db';
import { itemsMatch } from '../../lib/color';
import { categoryLabel, SEASON_OPTIONS } from '../../lib/constants';

function getSlotsForSeed(seedCategory) {
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

function pickForSlot(candidates, chosenSoFar) {
  if (candidates.length === 0) return null;
  const strict = candidates.filter((c) => chosenSoFar.every((ch) => itemsMatch(c, ch)));
  const pool = strict.length ? strict : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateOutfit(seed, allItems) {
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

export default function OutfitsPage() {
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [seedId, setSeedId] = useState('');
  const [season, setSeason] = useState('alle');
  const [suggestions, setSuggestions] = useState([]);
  const [outfitName, setOutfitName] = useState('');

  useEffect(() => { load(); }, []);

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

  const compatible = useMemo(() => {
    if (!seed) return {};
    const groups = {};
    seasonFiltered.filter((i) => i.id !== seed.id && itemsMatch(seed, i)).forEach((i) => {
      groups[i.category] = groups[i.category] || [];
      groups[i.category].push(i);
    });
    return groups;
  }, [seed, seasonFiltered]);

  function reroll() {
    if (!seed) return;
    const a = generateOutfit(seed, seasonFiltered);
    const b = generateOutfit(seed, seasonFiltered);
    setSuggestions([a, b]);
  }

  useEffect(() => { if (seed) reroll(); /* eslint-disable-next-line */ }, [seedId, season, items.length]);

  async function saveOutfit(suggestion) {
    const outfit = {
      id: crypto.randomUUID(),
      name: outfitName || `Outfit mit ${seed.subtype || categoryLabel(seed.category)}`,
      itemIds: suggestion.items.map((i) => i.id),
      createdAt: Date.now(),
    };
    await db.addOutfit(outfit);
    setOutfits((prev) => [outfit, ...prev]);
    setOutfitName('');
  }

  async function removeOutfit(id) {
    if (!window.confirm('Dieses gespeicherte Outfit wirklich loeschen?')) return;
    await db.deleteOutfit(id);
    setOutfits((prev) => prev.filter((o) => o.id !== id));
  }

  if (items.length === 0) {
    return <div className="empty">Fuege zuerst Kleidungsstuecke in deinem Schrank hinzu.</div>;
  }

  const topScore = suggestions.length ? Math.max(...suggestions.map((s) => s.score)) : null;

  return (
    <div>
      <div className="page-header">
        <h1>Kombinieren</h1>
        <p>Waehle ein Teil - wir zeigen passende Kombinationen.</p>
      </div>

      {topScore !== null && (
        <div className="top-badge-wrap">
          <span className="top-badge">Top-Match {topScore}%</span>
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

      <div className="pill-row">
        <button type="button" className={'pill' + (season === 'alle' ? ' active' : '')} onClick={() => setSeason('alle')}>Alle</button>
        {SEASON_OPTIONS.map((s) => (
          <button key={s} type="button" className={'pill' + (season === s.toLowerCase() ? ' active' : '')}
            onClick={() => setSeason(s.toLowerCase())}>{s}</button>
        ))}
      </div>

      {seed && (
        <>
          <div className="row" style={{ marginBottom: 20 }}>
            <button className="btn btn-block" onClick={reroll}>🔀 Neu mischen</button>
          </div>

          <div className="section">
            <div className="section-title">Alles, was zu {seed.subtype || categoryLabel(seed.category)} passt</div>
            {Object.keys(compatible).length === 0 ? (
              <p className="card-sub">Noch keine farblich passenden Teile gefunden - lade mehr Kleidung hoch.</p>
            ) : (
              Object.entries(compatible).map(([cat, list]) => (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <p className="card-sub" style={{ marginBottom: 6, fontWeight: 600 }}>{categoryLabel(cat)}</p>
                  <div className="outfit-strip">
                    {list.map((i) => <img key={i.id} src={i.image} title={i.subtype} alt={i.subtype || ''} />)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="section">
            <div className="section-title">Vorschlaege</div>
            <div className="field">
              <input type="text" placeholder="Name fuer gespeicherte Outfits (optional)"
                value={outfitName} onChange={(e) => setOutfitName(e.target.value)} />
            </div>
            {suggestions.map((s, idx) => (
              <div key={idx} className="outfit-card">
                <div className="outfit-card-head">
                  <strong>Vorschlag {idx + 1}</strong>
                  <span className="card-sub">{s.score}% Match</span>
                </div>
                <div className="outfit-strip">
                  {s.items.map((i) => <img key={i.id} src={i.image} title={i.subtype} alt={i.subtype || ''} />)}
                </div>
                {s.missing.length > 0 && (
                  <p className="card-sub" style={{ marginTop: 8 }}>Fehlt noch: {s.missing.join(', ')}</p>
                )}
                <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => saveOutfit(s)}>
                  Als Outfit speichern
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {outfits.length > 0 && (
        <div className="section">
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
