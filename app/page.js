'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '../lib/db';
import ItemCard from '../components/ItemCard';
import ItemDetail from '../components/ItemDetail';
import { CATEGORIES, categoryLabel } from '../lib/constants';
import { getCurrentProfileName } from '../lib/profile';
import { generateOutfit } from '../lib/outfitEngine';
import { getLiveWeather, calendarSeason } from '../lib/weather';
import { IconSearch } from '../components/Icons';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Noch wach';
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Hey';
  return 'Guten Abend';
}

const SEASON_LABEL = { winter: 'Winter', fruehling: 'Fruehling', sommer: 'Sommer', herbst: 'Herbst' };
const SORT_OPTIONS = [
  { key: 'neueste', label: 'Neueste' },
  { key: 'meistgetragen', label: 'Meistgetragen' },
  { key: 'zuletzt', label: 'Zuletzt getragen' },
  { key: 'favoriten', label: 'Favoriten zuerst' },
];

export default function ClosetPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterCategory, setFilterCategory] = useState('alle');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('neueste');
  const [name, setName] = useState('');
  const [weather, setWeather] = useState(null);
  const [todayOutfit, setTodayOutfit] = useState(null);

  useEffect(() => {
    load();
    setName(getCurrentProfileName());
    getLiveWeather().then(setWeather);
  }, []);

  async function load() {
    setLoading(true);
    const all = await db.getItems();
    const active = all.filter((i) => !i.trashedAt);
    setItems(active.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
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

  const recent = useMemo(() => items.slice(0, 10), [items]);
  const favorites = useMemo(() => items.filter((i) => i.isFavorite), [items]);

  const season = weather ? weather.season : calendarSeason();

  useEffect(() => {
    if (items.length === 0) { setTodayOutfit(null); return; }
    const seasonMatches = items.filter((i) => !i.season || i.season.length === 0 || i.season.includes(season));
    const pool = seasonMatches.length ? seasonMatches : items;
    const seed = pool[Math.floor(Math.random() * pool.length)];
    setTodayOutfit(generateOutfit(seed, pool));
    // eslint-disable-next-line
  }, [items.length, season]);

  function rerollToday() {
    if (items.length === 0) return;
    const seasonMatches = items.filter((i) => !i.season || i.season.length === 0 || i.season.includes(season));
    const pool = seasonMatches.length ? seasonMatches : items;
    const seed = pool[Math.floor(Math.random() * pool.length)];
    setTodayOutfit(generateOutfit(seed, pool));
  }

  const filtered = useMemo(() => {
    let list = filterCategory === 'alle' ? items : items.filter((i) => i.category === filterCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) =>
        (i.subtype || '').toLowerCase().includes(q) ||
        (i.brand || '').toLowerCase().includes(q) ||
        (i.colorLabel || '').toLowerCase().includes(q) ||
        categoryLabel(i.category).toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sortBy === 'meistgetragen') sorted.sort((a, b) => (b.wornCount || 0) - (a.wornCount || 0));
    else if (sortBy === 'zuletzt') sorted.sort((a, b) => (b.lastWornAt || 0) - (a.lastWornAt || 0));
    else if (sortBy === 'favoriten') sorted.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    else sorted.sort((a, b) => b.createdAt - a.createdAt);
    return sorted;
  }, [items, filterCategory, search, sortBy]);

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
          <Link href="/add" className="btn btn-primary" style={{ marginTop: 14, display: 'inline-flex' }}>+ Teil hinzufuegen</Link>
        </div>
      ) : (
        <>
          {todayOutfit && (
            <div className="section">
              <div className="section-title">Outfit fuer heute · {SEASON_LABEL[season]}</div>
              <div className="outfit-card">
                <div className="outfit-strip">
                  {todayOutfit.items.map((i) => <img key={i.id} src={i.image} alt={i.subtype || ''} />)}
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn" onClick={rerollToday}>🔀 Anderer Vorschlag</button>
                  <Link href="/outfits" className="btn btn-primary">Zum Kombinieren</Link>
                </div>
              </div>
            </div>
          )}

          <div className="section">
            <div className="section-title-row">
              <span className="section-title" style={{ marginBottom: 0 }}>Zuletzt hinzugefuegt</span>
            </div>
            <div className="hscroll">
              {recent.map((i) => (
                <div key={i.id} className="hscroll-item" onClick={() => setSelected(i)}>
                  <img src={i.image} alt={i.subtype || ''} />
                  <p className="card-title">{i.subtype || categoryLabel(i.category)}</p>
                </div>
              ))}
            </div>
          </div>

          {favorites.length > 0 && (
            <div className="section">
              <div className="section-title">Deine Favoriten</div>
              <div className="hscroll">
                {favorites.map((i) => (
                  <div key={i.id} className="hscroll-item" onClick={() => setSelected(i)}>
                    <img src={i.image} alt={i.subtype || ''} />
                    <p className="card-title">{i.subtype || categoryLabel(i.category)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="section">
            <div className="section-title">Kategorien</div>
            <div className="cat-tile-grid">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" className="cat-tile"
                  onClick={() => setFilterCategory(filterCategory === c.key ? 'alle' : c.key)}
                  style={filterCategory === c.key ? { borderColor: 'var(--ink)' } : undefined}>
                  <span className="cat-tile-icon">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-title-row">
              <span className="section-title" style={{ marginBottom: 0 }}>
                {filterCategory === 'alle' ? 'Alles' : categoryLabel(filterCategory)}
              </span>
              {filterCategory !== 'alle' && <a onClick={() => setFilterCategory('alle')} style={{ cursor: 'pointer' }}>Alle anzeigen</a>}
            </div>

            <div className="search-row">
              <IconSearch size={16} className="search-icon" />
              <input type="text" placeholder="Suche nach Name, Marke oder Farbe..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="pill-row">
              {SORT_OPTIONS.map((s) => (
                <button key={s.key} type="button" className={'pill' + (sortBy === s.key ? ' active' : '')}
                  onClick={() => setSortBy(s.key)}>{s.label}</button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="card-sub">Keine Treffer.</p>
            ) : (
              <div className="grid-2">
                {filtered.map((item) => (
                  <ItemCard key={item.id} item={item} onClick={setSelected} onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {selected && <ItemDetail item={selected} onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />}
    </div>
  );
}
