'use client';
import { useState } from 'react';
import { CATEGORIES, FIT_OPTIONS, PATTERN_OPTIONS, SEASON_OPTIONS, COLOR_SWATCHES, categoryLabel, categoryIcon } from '../lib/constants';
import { IconEdit } from './Icons';

export default function ItemDetail({ item, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState({ ...item });
  const [editing, setEditing] = useState(false);

  function toggleSeason(s) {
    const cur = draft.season || [];
    setDraft({ ...draft, season: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  }

  function pickColor(swatch) {
    setDraft({ ...draft, colorHex: swatch.hex, colorLabel: swatch.label, colorFamily: swatch.family, colorHue: swatch.hue, isNeutral: swatch.isNeutral });
  }

  function save() {
    onSave({ ...draft });
    setEditing(false);
  }

  function logWorn() {
    onSave({ ...item, wornCount: (item.wornCount || 0) + 1, lastWornAt: Date.now() });
  }

  function toggleFavorite() {
    onSave({ ...item, isFavorite: !item.isFavorite });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <img className="preview-img" src={item.image} alt={item.subtype || ''} />
        {!editing ? (
          <>
            <div className="row" style={{ alignItems: 'flex-start', marginBottom: 4 }}>
              <h2 style={{ margin: 0 }}>{categoryIcon(item.category)} {item.subtype || categoryLabel(item.category)}</h2>
              <button className="fav-heart" style={{ position: 'static', boxShadow: 'none', background: 'none' }} onClick={toggleFavorite}>
                {item.isFavorite ? '♥' : '♡'}
              </button>
            </div>
            <p><span className="swatch" style={{ background: item.colorHex }} /> {item.colorLabel} · {categoryLabel(item.category)}</p>
            <p>Groesse: {item.size || '-'} · Fit: {item.fit || '-'}{item.brand ? ` · ${item.brand}` : ''}</p>
            <p>Muster: {item.pattern || '-'} · Material: {item.material || '-'}</p>
            <p>Saison: {(item.season || []).join(', ') || '-'}</p>
            {item.notes && <p>Notiz: {item.notes}</p>}

            <div className="stat-box" style={{ marginBottom: 16 }}>
              <div className="stat-num">{item.wornCount || 0}×</div>
              <div className="stat-label">getragen</div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={logWorn}>
                👕 Heute getragen
              </button>
            </div>

            <div className="row">
              <button className="btn" onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconEdit size={15} /> Bearbeiten
              </button>
              <button className="btn btn-danger" onClick={() => onDelete(item.id)}>Loeschen</button>
              <button className="btn" onClick={onClose}>Schliessen</button>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label>Kategorie</label>
              <div className="pill-row">
                {CATEGORIES.map((c) => (
                  <button key={c.key} type="button" className={'pill' + (draft.category === c.key ? ' active' : '')}
                    onClick={() => setDraft({ ...draft, category: c.key })}>{c.icon} {c.label}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Bezeichnung</label>
              <input type="text" value={draft.subtype || ''} onChange={(e) => setDraft({ ...draft, subtype: e.target.value })} />
            </div>

            <div className="field">
              <label>Farbe</label>
              <div className="color-preview-row">
                <span className="color-preview-swatch" style={{ background: draft.colorHex }} />
                <span>{draft.colorLabel}</span>
              </div>
              <div className="swatch-grid">
                {COLOR_SWATCHES.map((s) => (
                  <button key={s.family} type="button" className={'swatch-option' + (draft.colorFamily === s.family ? ' active' : '')}
                    onClick={() => pickColor(s)}>
                    <span className="swatch-circle" style={{ background: s.hex }} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Muster</label>
              <div className="pill-row">
                {PATTERN_OPTIONS.map((p) => (
                  <button key={p} type="button" className={'pill' + (draft.pattern === p.toLowerCase() ? ' active' : '')}
                    onClick={() => setDraft({ ...draft, pattern: p.toLowerCase() })}>{p}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Saison</label>
              <div className="chip-group">
                {SEASON_OPTIONS.map((s) => (
                  <span key={s} className={'chip' + ((draft.season || []).includes(s.toLowerCase()) ? ' selected' : '')}
                    onClick={() => toggleSeason(s.toLowerCase())}>{s}</span>
                ))}
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Groesse</label>
                <input type="text" value={draft.size || ''} onChange={(e) => setDraft({ ...draft, size: e.target.value })} />
              </div>
              <div className="field">
                <label>Fit</label>
                <select value={draft.fit} onChange={(e) => setDraft({ ...draft, fit: e.target.value })}>
                  {FIT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Marke</label>
                <input type="text" value={draft.brand || ''} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
              </div>
              <div className="field">
                <label>Material</label>
                <input type="text" value={draft.material || ''} onChange={(e) => setDraft({ ...draft, material: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Notizen</label>
              <textarea value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
            <div className="row">
              <button className="btn" onClick={() => { setDraft({ ...item }); setEditing(false); }}>Abbrechen</button>
              <button className="btn btn-primary" onClick={save}>Speichern</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
