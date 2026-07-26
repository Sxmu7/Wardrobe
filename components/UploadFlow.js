'use client';
import { useState } from 'react';
import { fileToResizedDataUrl } from '../lib/image';
import { getDominantColor, classifyColor, hexToRgb } from '../lib/color';
import { analyzeItemImage } from '../lib/ai';
import { CATEGORIES, FIT_OPTIONS, PATTERN_OPTIONS, SEASON_OPTIONS } from '../lib/constants';

function emptyDraft() {
  return {
    category: 'oberteil', subtype: '', colorHex: '#888888', colorLabel: '', pattern: 'uni',
    season: [], material: '', size: '', fit: 'Unbekannt', notes: '', uncertain: [],
  };
}

export default function UploadFlow({ onDone, onCancel }) {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    const items = [];
    for (const file of files) {
      const dataUrl = await fileToResizedDataUrl(file);
      items.push({ dataUrl, draft: emptyDraft(), analyzing: true, error: null });
    }
    setQueue(items);
    setIndex(0);
    items.forEach((it, i) => runAnalysis(it, i));
  }

  async function runAnalysis(item, i) {
    try {
      const dom = await getDominantColor(item.dataUrl);
      const cls = classifyColor(dom.r, dom.g, dom.b);
      let draft = { ...emptyDraft(), colorHex: dom.hex, colorLabel: cls.label, colorFamily: cls.family, colorHue: cls.hue, isNeutral: cls.isNeutral };
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('anthropic_api_key') : null;
      const model = typeof window !== 'undefined' ? localStorage.getItem('anthropic_model') : null;
      let uncertain = ['size', 'fit'];
      if (apiKey) {
        try {
          const ai = await analyzeItemImage(item.dataUrl, apiKey, model);
          draft.category = ai.category || draft.category;
          draft.subtype = ai.subtype || '';
          if (ai.colorHex) draft.colorHex = ai.colorHex;
          draft.colorLabel = ai.colorNameDe || draft.colorLabel;
          draft.pattern = ai.pattern || 'uni';
          draft.season = Array.isArray(ai.season) ? ai.season : [];
          draft.material = ai.material || '';
          if (ai.fitGuess) draft.fit = ai.fitGuess;
          const conf = ai.confidence || {};
          Object.keys(conf).forEach((k) => { if (conf[k] < 0.6 && uncertain.indexOf(k) === -1) uncertain.push(k); });
        } catch (e) {
          draft.aiError = e.message;
        }
      } else {
        draft.aiError = 'Kein API-Key hinterlegt - bitte Angaben manuell pruefen (Einstellungen).';
      }
      draft.uncertain = uncertain;
      setQueue((q) => {
        const copy = [...q];
        copy[i] = { ...copy[i], draft, analyzing: false };
        return copy;
      });
    } catch (e) {
      setQueue((q) => {
        const copy = [...q];
        copy[i] = { ...copy[i], analyzing: false, error: e.message };
        return copy;
      });
    }
  }

  function updateDraft(patch) {
    setQueue((q) => {
      const copy = [...q];
      copy[index] = { ...copy[index], draft: { ...copy[index].draft, ...patch } };
      return copy;
    });
  }

  function toggleSeason(s) {
    const current = queue[index].draft.season || [];
    updateDraft({ season: current.includes(s) ? current.filter((x) => x !== s) : [...current, s] });
  }

  function saveCurrentAndNext() {
    const current = queue[index];
    let colorFamily = current.draft.colorFamily;
    let colorHue = current.draft.colorHue;
    let isNeutral = current.draft.isNeutral;
    try {
      const { r, g, b } = hexToRgb(current.draft.colorHex);
      const cls = classifyColor(r, g, b);
      colorFamily = cls.family; colorHue = cls.hue; isNeutral = cls.isNeutral;
    } catch (e) {}
    const item = {
      id: crypto.randomUUID(),
      image: current.dataUrl,
      ...current.draft,
      colorFamily, colorHue, isNeutral,
      createdAt: Date.now(),
    };
    const isLast = index === queue.length - 1;
    onDone(item, isLast);
    if (!isLast) setIndex(index + 1);
  }

  if (queue.length === 0) {
    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>Kleidungsstueck hinzufuegen</h2>
          <label className="upload-drop">
            <input type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={(e) => e.target.files.length && handleFiles(e.target.files)} />
            Klicke hier, um ein oder mehrere Fotos hochzuladen
          </label>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn" onClick={onCancel}>Abbrechen</button>
          </div>
        </div>
      </div>
    );
  }

  const current = queue[index];
  const draft = current.draft;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Teil {index + 1} von {queue.length}</h2>
        <img className="preview-img" src={current.dataUrl} alt="Vorschau" />

        {current.analyzing && <p className="loading-dots">KI analysiert das Bild</p>}
        {draft.aiError && <div className="banner">{draft.aiError}</div>}

        {!current.analyzing && (
          <>
            <div className="row">
              <div className="field">
                <label>Kategorie</label>
                <select value={draft.category} onChange={(e) => updateDraft({ category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Bezeichnung</label>
                <input type="text" value={draft.subtype} placeholder="z.B. Pullover"
                  onChange={(e) => updateDraft({ subtype: e.target.value })} />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label>Farbe {draft.uncertain?.includes('colorHex') && <span className="uncertain-badge">KI unsicher</span>}</label>
                <input type="text" value={draft.colorHex} onChange={(e) => updateDraft({ colorHex: e.target.value })} style={{ marginBottom: 6 }} />
                <input type="text" value={draft.colorLabel} placeholder="Farbname"
                  onChange={(e) => updateDraft({ colorLabel: e.target.value })} />
              </div>
              <div className="field">
                <label>Muster {draft.uncertain?.includes('pattern') && <span className="uncertain-badge">KI unsicher</span>}</label>
                <select value={draft.pattern} onChange={(e) => updateDraft({ pattern: e.target.value })}>
                  {PATTERN_OPTIONS.map((p) => <option key={p} value={p.toLowerCase()}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Saison {draft.uncertain?.includes('season') && <span className="uncertain-badge">KI unsicher</span>}</label>
              <div className="chip-group">
                {SEASON_OPTIONS.map((s) => (
                  <span key={s} className={'chip' + (draft.season?.includes(s.toLowerCase()) ? ' selected' : '')}
                    onClick={() => toggleSeason(s.toLowerCase())}>{s}</span>
                ))}
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label>Groesse (bitte angeben)</label>
                <input type="text" value={draft.size} placeholder="z.B. M oder 38"
                  onChange={(e) => updateDraft({ size: e.target.value })} />
              </div>
              <div className="field">
                <label>Fit / Passform (bitte pruefen)</label>
                <select value={draft.fit} onChange={(e) => updateDraft({ fit: e.target.value })}>
                  {FIT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Material {draft.uncertain?.includes('material') && <span className="uncertain-badge">KI unsicher</span>}</label>
              <input type="text" value={draft.material} onChange={(e) => updateDraft({ material: e.target.value })} />
            </div>

            <div className="field">
              <label>Notizen</label>
              <textarea value={draft.notes} onChange={(e) => updateDraft({ notes: e.target.value })} />
            </div>

            <div className="row">
              <button className="btn" onClick={onCancel}>Abbrechen</button>
              <button className="btn btn-primary" onClick={saveCurrentAndNext}>
                {index === queue.length - 1 ? 'Speichern & Fertig' : 'Speichern & Weiter'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
