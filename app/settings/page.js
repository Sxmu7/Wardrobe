'use client';
import { useEffect, useState } from 'react';

const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (schnell & guenstig, empfohlen)' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5 (genauer, teurer)' },
  { value: 'claude-opus-5', label: 'Claude Opus 5 (am genauesten, am teuersten)' },
];

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(MODELS[0].value);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem('anthropic_api_key') || '');
    setModel(localStorage.getItem('anthropic_model') || MODELS[0].value);
  }, []);

  function save() {
    localStorage.setItem('anthropic_api_key', apiKey);
    localStorage.setItem('anthropic_model', model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Einstellungen</h1>
          <p>Hinterlege deinen Anthropic API-Key fuer die automatische KI-Erkennung.</p>
        </div>
      </div>

      <div className="banner">
        Der API-Key wird ausschliesslich lokal in deinem Browser gespeichert und nur zur Bilderkennung an Anthropic uebermittelt.
        Ohne Key kannst du Kleidungsstuecke weiterhin manuell erfassen (mit automatischer Farberkennung).
        Einen Key erhaeltst du unter <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a>.
      </div>

      <div className="field" style={{ maxWidth: 480 }}>
        <label>Anthropic API-Key</label>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-..." />
      </div>

      <div className="field" style={{ maxWidth: 480 }}>
        <label>KI-Modell</label>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <button className="btn btn-primary" onClick={save}>Speichern</button>
      {saved && <span style={{ marginLeft: 12, color: 'var(--success)' }}>Gespeichert ✓</span>}
    </div>
  );
}
