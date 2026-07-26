'use client';
import { useState } from 'react';
import { CATEGORIES, FIT_OPTIONS, PATTERN_OPTIONS, SEASON_OPTIONS, categoryLabel } from '../lib/constants';
import { classifyColor, hexToRgb } from '../lib/color';

export default function ItemDetail({ item, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState({ ...item });
  const [editing, setEditing] = useState(false);

  function toggleSeason(s) {
    const cur = draft.season || [];
    setDraft({ ...draft, season: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  }

  function save() {
    let patch = { ...draft };
    try {
      const { r, g, b } = hexToRgb(patch.colorHex);
      const cls = classifyColor(r, g, b);
      patch.colorFamily = cls.family; patch.colorHue = cls.hue; patch.isNeutral = cls.isNeutral;
    } catch (e) {}
    onSave(patch);
    setEditing(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <img className="preview-img" src={item.image} alt={item.subtype || ''} />
        {!editing ? (
          <>
            <h2>{item.subtype || categoryLabel(item.category)}</h2>
            <p><span className="swatch" style={{ background: item.colorHex }} /> {item.colorLabel} - {categoryLabel(item.category)}</p>
            <p>Groesse: {item.size || '-'} - Fit: {item.fit || '-'}</p>
            <p>Muster: {item.pattern || '-'} - Material: {item.material || '-'}</p>
            <p>Saison: {(item.season || []).join(', ') || '-'}</p>
            {item.notes && <p>Notiz: {item.notes}</p>}
            <div className="row">
              <button className="btn" onClick={() => setEditing(true)}>Bearbeiten</button>
              <button className="btn btn-danger" onClick={() => onDelete(item.id)}>Loeschen</button>
              <button className="btn" onClick={onClose}>Schliessen</button>
            </div>
          </>
        ) : (
          <>
            <div className="row">
              <div className="field">
                <label>Kategorie</label>
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Bezeichnung</label>
                <input type="text" value={draft.subtype || ''} onChange={(e) => setDraft({ ...draft, subtype: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label>Farbe</label>
                <input type="text" value={draft.colorHex || ''} onChange={(e) => setDraft({ ...draft, colorHex: e.target.value })} style={{ marginBottom: 6 }} />
                <input type="text" value={draft.colorLabel || ''} onChange={(e) => setDraft({ ...draft, colorLabel: e.target.value })} />
              </div>
              <div className="field">
                <label>Muster</label>
                <select value={draft.pattern} onChange={(e) => setDraft({ ...draft, pattern: e.target.value })}>
                  {PATTERN_OPTIONS.map((p) => <option key={p} value={p.toLowerCase()}>{p}</option>)}
                </select>
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
            <div className="field">
              <label>Material</label>
              <input type="text" value={draft.material || ''} onChange={(e) => setDraft({ ...draft, material: e.target.value })} />
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
