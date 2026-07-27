'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '../lib/db';
import ItemCard from '../components/ItemCard';
import ItemDetail from '../components/ItemDetail';
import { categoryLabel } from '../lib/constants';
import { getCurrentProfileName } from '../lib/profile';
import { getLiveWeather, calendarSeason } from '../lib/weather';
import { loadDemoItems } from '../lib/seedData';
import { useScrollReveal } from '../lib/useReveal';
import { IconSearch, IconClose, IconSparkle } from '../components/Icons';
import {
  loadTodayFit, saveTodayFit, resetTodayFit, slotForCategory,
  nextOpenSlot, pickedItemsList, suggestionsForSlot,
} from '../lib/dailyFit';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Noch wach';
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Hey';
  return 'Guten Abend';
}

const SEASON_LABEL = { winter: 'Winter', fruehling: 'Fruehling', sommer: 'Sommer', herbst: 'Herbst' };

export default function ClosetPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [weather, setWeather] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [fit, setFit] = useState({ date: '', picks: {} });
  const [rerollNonce, setRerollNonce] = useState(0);
  const [fitName, setFitName] = useState('');
  const [fitSaved, setFitSaved] = useState(false);

  useEffect(() => {
    load();
    setName(getCurrentProfileName());
    getLiveWeather().then(setWeather);
    setFit(loadTodayFit());
  }, []);

  async function load() {
    setLoading(true);
    const all = await db.getItems();
    const active = all.filter((i) => !i.trashedAt);
    setItems(active.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }

  async function handleLoadDemo() {
    setSeeding(true);
    await loadDemoItems(db);
    await load();
    setSeeding(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('In den Papierkorb verschieben? Du kannst das Teil dort 30 Tage lang wiederherstellen.')) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await db.addItem({ ...item, trashedAt: Date.now() });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected(null);
  }

  async function handleSave(patch) {
    await db.addItem(patch);
    setItems((prev) => prev.map((i) => (i.id === patch.id ? patch : i)));
    setSelected(patch);
  }

  async function toggleFavorite(item) {
    const patch = { ...item, isFavorite: !item.isFavorite };
    await db.addItem(patch);
    setItems((prev) => prev.map((i) => (i.id === patch.id ? patch : i)));
  }

  const season = weather ? weather.season : calendarSeason();

  const chosenSoFar = useMemo(() => pickedItemsList(items, fit.picks || {}), [items, fit]);
  const currentSlot = useMemo(() => nextOpenSlot(items, fit.picks || {}), [items, fit]);
  const suggestions = useMemo(
    () => (currentSlot ? suggestionsForSlot(items, currentSlot, fit.picks || {}, chosenSoFar, rerollNonce) : []),
    [items, currentSlot, fit, chosenSoFar, rerollNonce]
  );
  const fitDone = !currentSlot && chosenSoFar.length > 0;

  function updateFit(next) {
    setFit(next);
    saveTodayFit(next);
  }

  function addToFit(item) {
    const slot = slotForCategory(item.category);
    setSelected(null);
    if (!slot) return;
    updateFit({ ...fit, picks: { ...fit.picks, [slot.key]: item.id } });
  }

  function skipSlot() {
    if (!currentSlot) return;
    updateFit({ ...fit, picks: { ...fit.picks, [currentSlot.key]: 'skip' } });
  }

  function rerollSlot() {
    setRerollNonce((n) => n + 1);
  }

  function restartFit() {
    setFit(resetTodayFit());
    setRerollNonce((n) => n + 1);
    setFitName('');
    setFitSaved(false);
  }

  async function saveFit() {
    if (chosenSoFar.length === 0) return;
    const rec = {
      id: crypto.randomUUID(),
      name: fitName.trim() || `Fit vom ${new Date().toLocaleDateString('de-DE')}`,
      itemIds: chosenSoFar.map((i) => i.id),
      createdAt: Date.now(),
    };
    await db.addOutfit(rec);
    setFitSaved(true);
    setFitName('');
    setTimeout(() => setFitSaved(false), 2200);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return items.filter((i) =>
      (i.subtype || '').toLowerCase().includes(q) ||
      (i.brand || '').toLowerCase().includes(q) ||
      (i.colorLabel || '').toLowerCase().includes(q) ||
      categoryLabel(i.category).toLowerCase().includes(q)
    );
  }, [items, search]);

  const searchActive = search.trim().length > 0;

  useScrollReveal([loading, items.length, searchActive, currentSlot && currentSlot.key, fitDone]);

  return (
    <div>
      <div className="page-header">
        <h1>{greeting()}{name ? `, ${name}` : ''} 👋</h1>
        <p>Du hast {items.length} Kleidungsstuecke in deinem Schrank.</p>
      </div>

      {weather && (
        <div className="weather-chip">
          <span>{weather.icon}</span>
          <span>{weather.tempC}°C · {weather.label}</span>
        </div>
      )}

      {loading ? (
        <p className="card-sub">Lade...</p>
      ) : items.length === 0 ? (
        <div className="empty">
          Noch keine Kleidungsstuecke.<br />
          <div className="row" style={{ marginTop: 14, justifyContent: 'center' }}>
            <Link href="/add" className="btn btn-primary" style={{ display: 'inline-flex' }}>+ Teil hinzufuegen</Link>
            <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleLoadDemo} disabled={seeding}>
              <IconSparkle size={15} /> {seeding ? 'Laedt...' : 'Beispiele laden'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="sticky-filters reveal">
            <div className="search-row">
              <IconSearch size={16} className="search-icon" />
              <input type="text" placeholder="Suche nach Name, Marke oder Farbe..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
              {searchActive && (
                <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label="Suche loeschen">
                  <IconClose size={12} />
                </button>
              )}
            </div>
          </div>

          {searchActive ? (
            <div className="section reveal">
              <div className="section-title-row">
                <span className="section-title" style={{ marginBottom: 0 }}>
                  {filtered.length} {filtered.length === 1 ? 'Treffer' : 'Treffer'}
                </span>
              </div>
              {filtered.length === 0 ? (
                <p className="card-sub">Keine Treffer fuer "{search}".</p>
              ) : (
                <div className="grid-2">
                  {filtered.map((item) => (
                    <ItemCard key={item.id} item={item} onClick={setSelected} onToggleFavorite={toggleFavorite} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="section reveal">
              <div className="section-title-row">
                <span className="section-title" style={{ marginBottom: 0 }}>
                  Dein Fit fuer heute{weather ? ` · ${SEASON_LABEL[season]}` : ''}
                </span>
              </div>

              {chosenSoFar.length > 0 && (
                <div className="fit-progress-strip">
                  {chosenSoFar.map((i) => (
                    <div key={i.id} className="fit-progress-thumb" onClick={() => setSelected(i)}>
                      <img src={i.image} alt={i.subtype || ''} />
                    </div>
                  ))}
                </div>
              )}

              {currentSlot ? (
                <>
                  <p className="fit-slot-label">{currentSlot.label}</p>
                  <div className="grid-2">
                    {suggestions.map((item) => (
                      <ItemCard key={item.id} item={item} onClick={setSelected} onToggleFavorite={toggleFavorite} />
                    ))}
                  </div>
                  <div className="row" style={{ marginTop: 14 }}>
                    <button className="btn" onClick={rerollSlot}>🔀 Andere Vorschlaege</button>
                    <button className="btn" onClick={skipSlot}>Ueberspringen</button>
                  </div>
                </>
              ) : fitDone ? (
                <div className="hero-outfit-card">
                  <img className="hero-outfit-bg" src={chosenSoFar[0].image} alt="" aria-hidden="true" />
                  <div className="hero-outfit-scrim" />
                  <div className="hero-outfit-content">
                    <p style={{ color: '#fff', fontWeight: 700, marginBottom: 12 }}>Dein Fit steht ✓</p>
                    <div className="outfit-strip hero-outfit-strip">
                      {chosenSoFar.map((i) => (
                        <img key={i.id} src={i.image} alt={i.subtype || ''} onClick={() => setSelected(i)} />
                      ))}
                    </div>
                    <input
                      type="text"
                      className="hero-outfit-name-input"
                      placeholder="Name fuer diesen Fit (optional)"
                      value={fitName}
                      onChange={(e) => setFitName(e.target.value)}
                    />
                    <div className="row" style={{ marginTop: 12 }}>
                      <button className="btn hero-glass-btn" onClick={restartFit}>🔀 Neu mischen</button>
                      <button className="btn btn-primary" onClick={saveFit}>{fitSaved ? 'Gespeichert ✓' : '💾 Fit speichern'}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p className="card-sub">Alle Kategorien uebersprungen.</p>
                  <button className="btn" onClick={restartFit} style={{ marginTop: 10 }}>🔀 Neu mischen</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selected && (
        <ItemDetail item={selected} onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} onAddToFit={addToFit} />
      )}
    </div>
  );
}
