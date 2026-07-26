'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { CATEGORIES, categoryLabel } from '../../lib/constants';
import { getCurrentProfileId, getCurrentProfileName, setCurrentProfile, fetchProfiles, createProfileRemote } from '../../lib/profile';
import { getStoredTheme, setStoredTheme } from '../../lib/theme';

const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (schnell & guenstig, empfohlen)' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5 (genauer, teurer)' },
  { value: 'claude-opus-5', label: 'Claude Opus 5 (am genauesten, am teuersten)' },
];

export default function ProfilPage() {
  const [profileId, setProfileId] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [creating, setCreating] = useState(false);

  const [itemCount, setItemCount] = useState(0);
  const [outfitCount, setOutfitCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});

  const [dark, setDark] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(MODELS[0].value);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfileId(getCurrentProfileId());
    setProfileName(getCurrentProfileName());
    setDark(getStoredTheme() === 'dark');
    setApiKey(localStorage.getItem('anthropic_api_key') || '');
    setModel(localStorage.getItem('anthropic_model') || MODELS[0].value);
    loadStats();
    loadProfiles();
  }, []);

  async function loadStats() {
    const items = await db.getItems();
    const outfits = await db.getOutfits();
    setItemCount(items.length);
    setOutfitCount(outfits.length);
    const counts = {};
    items.forEach((i) => { counts[i.category] = (counts[i.category] || 0) + 1; });
    setCategoryCounts(counts);
  }

  async function loadProfiles() {
    try {
      const list = await fetchProfiles();
      setProfiles(list);
    } catch (e) {}
  }

  function switchProfile(p) {
    setCurrentProfile(p.id, p.name);
    setProfileId(p.id);
    setProfileName(p.name);
  }

  async function addProfile() {
    const trimmed = newProfileName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const p = await createProfileRemote(trimmed);
      setProfiles((prev) => [...prev, p]);
      switchProfile(p);
      setNewProfileName('');
    } catch (e) {} finally {
      setCreating(false);
    }
  }

  function toggleDark() {
    const next = !dark;
    setDark(next);
    setStoredTheme(next ? 'dark' : 'light');
  }

  function saveSettings() {
    localStorage.setItem('anthropic_api_key', apiKey);
    localStorage.setItem('anthropic_model', model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const me = profiles.find((p) => p.id === profileId);
  const maxCat = Math.max(1, ...Object.values(categoryCounts));

  return (
    <div>
      <div className="page-header">
        <h1>Profil</h1>
      </div>

      <div className="avatar-circle" style={{ background: me ? me.avatar_color : '#c96f4a' }}>
        {me ? me.avatar_emoji : '🙂'}
      </div>
      <p className="profile-name">{profileName || 'Du'}</p>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-num">{itemCount}</div>
          <div className="stat-label">Teile</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{outfitCount}</div>
          <div className="stat-label">Outfits</div>
        </div>
      </div>

      <div className="toggle-row">
        <span>Dark Mode</span>
        <label className="switch">
          <input type="checkbox" checked={dark} onChange={toggleDark} />
          <span className="switch-track" />
          <span className="switch-thumb" />
        </label>
      </div>

      <div className="section">
        <div className="section-title">Nach Kategorie</div>
        {CATEGORIES.filter((c) => categoryCounts[c.key]).map((c) => (
          <div className="bar-row" key={c.key}>
            <div className="bar-row-head">
              <span>{c.label}</span>
              <span className="card-sub">{categoryCounts[c.key]}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: (categoryCounts[c.key] / maxCat) * 100 + '%' }} />
            </div>
          </div>
        ))}
        {Object.keys(categoryCounts).length === 0 && <p className="card-sub">Noch keine Teile im Schrank.</p>}
      </div>

      <div className="section">
        <div className="section-title">Profil wechseln</div>
        <div className="profile-switch-list">
          {profiles.map((p) => (
            <div key={p.id} className={'profile-chip' + (p.id === profileId ? ' active' : '')} onClick={() => switchProfile(p)}>
              <span className="friend-avatar" style={{ background: p.avatar_color, width: 20, height: 20, fontSize: 11 }}>{p.avatar_emoji}</span>
              {p.name}
            </div>
          ))}
        </div>
        <div className="row">
          <input type="text" placeholder="Neuer Profilname" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
          <button className="btn" onClick={addProfile} disabled={!newProfileName.trim() || creating}>
            {creating ? '...' : '+ Neues Profil'}
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-title">KI-Einstellungen</div>
        <div className="banner">
          Der API-Key wird nur lokal in diesem Browser gespeichert und ausschliesslich zur Bilderkennung verwendet.
          Einen Key erhaeltst du unter <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a>.
        </div>
        <div className="field">
          <label>Anthropic API-Key</label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-..." />
        </div>
        <div className="field">
          <label>KI-Modell</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={saveSettings}>Speichern</button>
        {saved && <span style={{ marginLeft: 12, color: 'var(--success)' }}>Gespeichert ✓</span>}
      </div>

      <p className="card-sub" style={{ textAlign: 'center' }}>Kleiderschrank · KI-gestuetztes Outfit-Matching</p>
    </div>
  );
}
