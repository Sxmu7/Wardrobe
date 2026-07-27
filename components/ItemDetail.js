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
        <div className="modal-grabber" />
        {!editing ? (
          <>
            <div className="detail-hero">
              <img src={item.image} alt={item.subtype || ''} />
              <button className="fav-heart detail-hero-fav" onClick={toggleFavorite}>
                {item.isFavorite ? '♥' : '♡'}
              </button>
            </div>

            <p className="detail-eyebrow">{categoryIcon(item.category)} {categoryLabel(item.category)}{item.brand ? ` · ${item.brand}` : ''}</p>
            <h2 className="detail-title">{item.subtype || categoryLabel(item.category)}</h2>

            {item.price && (
              <p className="shop-price">
                {parseFloat(item.price).toFixed(2)} €
                {item.wornCount > 0 && (
                  <span className="shop-price-per"> · {(parseFloat(item.price) / item.wornCount).toFixed(2)} € / Tragen</span>
                )}
              </p>
            )}

            <div className="spec-list">
              <div className="spec-row">
                <span className="spec-label">Farbe</span>
                <span className="spec-value"><span className="swatch" style={{ background: item.colorHex }} /> {item.colorLabel}</span>
              </div>
              {item.size && (
                <div className="spec-row">
                  <span className="spec-label">Groesse</span>
                  <span className="spec-value">{item.size}</span>
                </div>
              )}
              {item.fit && item.fit !== 'Unbekannt' && (
                <div className="spec-row">
                  <span className="spec-label">Fit</span>
                  <span className="spec-value">{item.fit}</span>
                </div>
              )}
              {item.pattern && (
                <div className="spec-row">
                  <span className="spec-label">Muster</span>
                  <span className="spec-value">{item.pattern}</span>
                </div>
              )}
              {item.material && (
                <div className="spec-row">
                  <span className="spec-label">Material</span>
                  <span className="spec-value">{item.material}</span>
                </div>
              )}
              {(item.season || []).length > 0 && (
                <div className="spec-row">
                  <span className="spec-label">Saison</span>
                  <span className="spec-value">{item.season.join(', ')}</span>
                </div>
              )}
            </div>

            {item.notes && <p className="card-sub shop-notes">{item.notes}</p>}

            <div className="shop-worn-row">
              <span className="shop-worn-count">{item.wornCount || 0}× getragen</span>
              <button className="btn-shop-mini" onClick={logWorn}>+ Heute getragen</button>
            </div>

            <div className="shop-actions">
              <button className="btn-shop" onClick={onClose}>Schliessen</button>
              <div className="shop-actions-row">
                <button className="btn-text" onClick={() => setEditing(true)}>
                  <IconEdit size={12} /> Bearbeiten
                </button>
                <button className="btn-text btn-text-danger" onClick={() => onDelete(item.id)}>Loeschen</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <img className="preview-img" src={item.image} alt={item.subtype || ''} />
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
              <label>Kaufpreis (optional)</label>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={draft.price || ''}
                placeholder="z.B. 39.90" onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
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
