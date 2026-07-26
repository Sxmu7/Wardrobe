'use client';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../lib/db';
import { itemsMatch } from '../../lib/color';
import { categoryLabel } from '../../lib/constants';

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
  return { items: chosen, missing };
}

export default function OutfitsPage() {
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [seedId, setSeedId] = useState('');
  const [generated, setGenerated] = useState(null);
  const [outfitName, setOutfitName] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const all = await db.getItems();
    setItems(all);
    const o = await db.getOutfits();
    setOutfits(o.sort((a, b) => b.createdAt - a.createdAt));
    if (all.length) setSeedId((prev) => prev || all[0].id);
  }

  const seed = items.find((i) => i.id === seedId);

  const compatible = useMemo(() => {
    if (!seed) return {};
    const groups = {};
    items.filter((i) => i.id !== seed.id && itemsMatch(seed, i)).forEach((i) => {
      groups[i.category] = groups[i.category] || [];
      groups[i.category].push(i);
    });
    return groups;
  }, [seed, items]);

  function reroll() {
    if (!seed) return;
    setGenerated(generateOutfit(seed, items));
  }

  useEffect(() => { if (seed) reroll(); /* eslint-disable-next-line */ }, [seedId, items.length]);

  async function saveOutfit() {
    if (!generated) return;
    const outfit = {
      id: crypto.randomUUID(),
      name: outfitName || `Outfit mit ${seed.subtype || categoryLabel(seed.category)}`,
      itemIds: generated.items.map((i) => i.id),
      createdAt: Date.now(),
    };
    await db.addOutfit(outfit);
    setOutfits((prev) => [outfit, ...prev]);
    setOutfitName('');
  }

  async function removeOutfit(id) {
    await db.deleteOutfit(id);
    setOutfits((prev) => prev.filter((o) => o.id !== id));
  }

  if (items.length === 0) {
    return <div className="empty">Fuege zuerst Kleidungsstuecke in deinem Kleiderschrank hinzu.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Outfit-Generator</h1>
          <p>Waehle ein Teil - die App zeigt dir, was farblich dazu passt.</p>
        </div>
      </div>

      <div className="field select-seed">
        <label>Basis-Teil</label>
        <select value={seedId} onChange={(e) => setSeedId(e.target.value)}>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {(i.subtype || categoryLabel(i.category))} - {i.colorLabel} ({categoryLabel(i.category)})
            </option>
          ))}
        </select>
      </div>

      {seed && (
        <>
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
            <div className="section-title">Outfit-Vorschlag</div>
            {generated && (
              <div className="outfit-card">
                <div className="outfit-strip">
                  {generated.items.map((i) => <img key={i.id} src={i.image} title={i.subtype} alt={i.subtype || ''} />)}
                </div>
                {generated.missing.length > 0 && (
                  <p className="card-sub" style={{ marginTop: 8 }}>
                    Fehlt noch in deinem Schrank: {generated.missing.join(', ')}
                  </p>
                )}
                <div className="row" style={{ marginTop: 14 }}>
                  <button className="btn" onClick={reroll}>Neu mischen</button>
                  <input type="text" placeholder="Name fuer dieses Outfit (optional)"
                    value={outfitName} onChange={(e) => setOutfitName(e.target.value)} />
                  <button className="btn btn-primary" onClick={saveOutfit}>Outfit speichern</button>
                </div>
              </div>
            )}
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
