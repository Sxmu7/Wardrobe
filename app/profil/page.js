'use client';
import { useEffect, useRef, useState } from 'react';
import { db } from '../../lib/db';
import { CATEGORIES, categoryLabel } from '../../lib/constants';
import { getCurrentProfileId, getCurrentProfileName, fetchProfiles, trySyncPendingProfile } from '../../lib/profile';
import { pushAllLocalToRemote } from '../../lib/accountSync';
import { getStoredTheme, setStoredTheme } from '../../lib/theme';
import { IconTrash, IconMoon, IconDownload, IconUpload, IconChevronRight, IconHeart, IconSparkle } from '../../components/Icons';
import { loadDemoItems } from '../../lib/seedData';
import { useScrollReveal } from '../../lib/useReveal';
import FeatureVotes from '../../components/FeatureVotes';

const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (schnell & guenstig, empfohlen)' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5 (genauer, teurer)' },
  { value: 'claude-opus-5', label: 'Claude Opus 5 (am genauesten, am teuersten)' },
];

function formatEuro(n) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export default function ProfilPage() {
  const [profileId, setProfileId] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [profiles, setProfiles] = useState([]);

  const [itemCount, setItemCount] = useState(0);
  const [outfitCount, setOutfitCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});

  const [dark, setDark] = useState(false);

  const [geminiKey, setGeminiKey] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(MODELS[0].value);
  const [saved, setSaved] = useState(false);

  const [backupMsg, setBackupMsg] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const importInputRef = useRef(null);

  function copyAccountCode() {
    if (!profileId) return;
    navigator.clipboard?.writeText(String(profileId)).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1600);
  }

  useScrollReveal([itemCount]);

  useEffect(() => {
    const existingId = getCurrentProfileId();
    setProfileId(existingId);
    setProfileName(getCurrentProfileName());
    setDark(getStoredTheme() === 'dark');
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setApiKey(localStorage.getItem('anthropic_api_key') || '');
    setModel(localStorage.getItem('anthropic_model') || MODELS[0].value);
    loadStats();
    loadProfiles();
    if (existingId) pushAllLocalToRemote();
    trySyncPendingProfile().then((synced) => {
      if (synced) { setProfileId(synced.id); loadProfiles(); pushAllLocalToRemote(); }
    });
  }, []);

  async function loadStats() {
    const all = await db.getItems();
    const items = all.filter((i) => !i.trashedAt);
    const outfits = await db.getOutfits();
    setItemCount(items.length);
    setOutfitCount(outfits.length);
    setTotalValue(items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0));
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

  function toggleDark() {
    const next = !dark;
    setDark(next);
    setStoredTheme(next ? 'dark' : 'light');
  }

  function saveSettings() {
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('anthropic_api_key', apiKey);
    localStorage.setItem('anthropic_model', model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function exportBackup() {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `myclo-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBackupMsg('Backup heruntergeladen ✓');
    setTimeout(() => setBackupMsg(''), 3000);
  }

  async function handleLoadDemo() {
    setSeeding(true);
    await loadDemoItems(db);
    await loadStats();
    setSeeding(false);
    setBackupMsg('Beispiel-Kleidungsstuecke geladen ✓');
    setTimeout(() => setBackupMsg(''), 3000);
  }

  async function handleDeleteAccount() {
    const sure = window.confirm(
      'Account wirklich loeschen? Alle Kleidungsstuecke, Outfits und Fotos werden unwiderruflich geloescht. Dieser Schritt kann nicht rueckgaengig gemacht werden.'
    );
    if (!sure) return;
    const reallySure = window.confirm('Letzte Warnung: Wirklich ALLE Daten dauerhaft loeschen?');
    if (!reallySure) return;

    setDeleting(true);
    try {
      if (profileId) {
        try {
          await fetch('/api/profiles', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id: profileId }),
          });
        } catch (e) {}
      }
      await db.clearAll();
      localStorage.clear();
    } finally {
      window.location.href = '/';
    }
  }

  async function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await db.importAll(data);
      setBackupMsg(`${result.itemsImported} Teile & ${result.outfitsImported} Outfits importiert ✓`);
      await loadStats();
    } catch (err) {
      setBackupMsg('Import fehlgeschlagen - ist das eine gueltige MyClo-Backup-Datei?');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
      setTimeout(() => setBackupMsg(''), 4000);
    }
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
      {profileId && (
        <button type="button" className="account-code-pill" onClick={copyAccountCode}>
          {codeCopied ? 'Kopiert ✓' : `Account-Code ${profileId} · zum Kopieren tippen`}
        </button>
      )}

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-num">{itemCount}</div>
          <div className="stat-label">Teile</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{outfitCount}</div>
          <div className="stat-label">Outfits</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{formatEuro(totalValue)}</div>
          <div className="stat-label">Wert</div>
        </div>
      </div>

      <div className="list-group">
        <div className="list-row" style={{ cursor: 'default' }}>
          <span className="list-row-icon" style={{ background: '#111111' }}><IconMoon size={15} /></span>
          <span className="list-row-label">Dark Mode</span>
          <label className="switch">
            <input type="checkbox" checked={dark} onChange={toggleDark} />
            <span className="switch-track" />
            <span className="switch-thumb" />
          </label>
        </div>
      </div>

      <div className="list-group">
        <a href="/papierkorb" className="list-row">
          <span className="list-row-icon" style={{ background: '#FF453A' }}><IconTrash size={15} /></span>
          <span className="list-row-label">Papierkorb</span>
          <IconChevronRight size={16} className="list-row-chevron" />
        </a>
        <button type="button" className="list-row" onClick={exportBackup}>
          <span className="list-row-icon" style={{ background: '#0A84FF' }}><IconDownload size={15} /></span>
          <span className="list-row-label">Backup exportieren</span>
          <IconChevronRight size={16} className="list-row-chevron" />
        </button>
        <button type="button" className="list-row" onClick={() => importInputRef.current?.click()}>
          <span className="list-row-icon" style={{ background: '#34C759' }}><IconUpload size={15} /></span>
          <span className="list-row-label">Backup importieren</span>
          <IconChevronRight size={16} className="list-row-chevron" />
        </button>
        <button type="button" className="list-row" onClick={handleLoadDemo} disabled={seeding}>
          <span className="list-row-icon" style={{ background: '#AF52DE' }}><IconSparkle size={15} /></span>
          <span className="list-row-label">{seeding ? 'Laedt...' : 'Beispiel-Kleidungsstuecke laden'}</span>
          <IconChevronRight size={16} className="list-row-chevron" />
        </button>
        <input ref={importInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importBackup} />
      </div>
      {backupMsg && <p className="card-sub" style={{ marginTop: -14, marginBottom: 24 }}>{backupMsg}</p>}

      <div className="section reveal">
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

      <div className="section reveal">
        <div className="section-title">Was soll als Naechstes kommen?</div>
        <p className="card-sub" style={{ marginBottom: 14 }}>Stimm ab, welche Funktionen als Naechstes zurueckkommen oder neu dazukommen sollen.</p>
        <FeatureVotes profileId={profileId} />
      </div>

      <div className="section reveal">
        <div className="section-title">KI-Einstellungen</div>
        <div className="banner">
          MyClo erkennt Kleidungsstuecke standardmaessig kostenlos direkt im Browser (kein API-Key noetig). Fuer deutlich praezisere Ergebnisse kannst du optional einen kostenlosen Google-Gemini-Key hinterlegen - dieser wird bevorzugt genutzt. Alternativ (kostenpflichtig, am genauesten) geht auch ein Anthropic-Key. Beide Keys werden nur lokal auf deinem Geraet gespeichert, nie an uns gesendet.
        </div>
        <div className="field">
          <label>Google Gemini API-Key (kostenlos, empfohlen)</label>
          <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="AIza... oder AQ...." />
          <p className="card-sub" style={{ marginTop: 6 }}>
            Kostenlosen Key erhaeltst du unter <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a>.
          </p>
        </div>
        <div className="field">
          <label>Anthropic API-Key (optional, kostenpflichtig)</label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-..." />
        </div>
        <div className="field">
          <label>Anthropic-Modell (nur falls Anthropic-Key gesetzt)</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={saveSettings}>Speichern</button>
        {saved && <span style={{ marginLeft: 12, color: 'var(--success)' }}>Gespeichert ✓</span>}
      </div>

      <div className="list-group">
        <a href="https://www.paypal.com/pool/9relvBFqEb?sr=wccr" target="_blank" rel="noreferrer" className="list-row">
          <span className="list-row-icon" style={{ background: '#FF9F0A' }}><IconHeart size={15} /></span>
          <span className="list-row-label">MyClo unterstuetzen</span>
          <IconChevronRight size={16} className="list-row-chevron" />
        </a>
      </div>

      <div className="list-group">
        <button type="button" className="list-row" onClick={handleDeleteAccount} disabled={deleting}>
          <span className="list-row-icon" style={{ background: '#FF453A' }}><IconTrash size={15} /></span>
          <span className="list-row-label" style={{ color: 'var(--danger)' }}>
            {deleting ? 'Wird geloescht...' : 'Account loeschen & Daten bereinigen'}
          </span>
          <IconChevronRight size={16} className="list-row-chevron" />
        </button>
      </div>

      <p className="card-sub" style={{ textAlign: 'center' }}>MyClo · designed and developed by SXMU</p>
    </div>
  );
}
