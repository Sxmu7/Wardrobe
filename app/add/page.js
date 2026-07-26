'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fileToResizedDataUrl } from '../../lib/image';
import { getDominantColor, classifyColor, hexToRgb } from '../../lib/color';
import { analyzeItemImage } from '../../lib/ai';
import { CATEGORIES, FIT_OPTIONS, PATTERN_OPTIONS, SEASON_OPTIONS, categoryLabel } from '../../lib/constants';
import { db } from '../../lib/db';

const TOTAL_STEPS = 4;

function emptyDraft() {
  return {
    category: 'oberteil', subtype: '', colorHex: '#888888', colorLabel: '', pattern: 'uni',
    season: [], material: '', size: '', fit: 'Unbekannt', notes: '', uncertain: [],
  };
}

export default function AddItemPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dataUrl, setDataUrl] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  function updateDraft(patch) { setDraft((d) => ({ ...d, ...patch })); }
  function toggleSeason(s) {
    const cur = draft.season || [];
    updateDraft({ season: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  }

  async function handleFile(file) {
    const url = await fileToResizedDataUrl(file);
    setDataUrl(url);
  }

  async function handleManual() {
    if (!dataUrl) return;
    setAnalyzing(true);
    setAiError('');
    try {
      const dom = await getDominantColor(dataUrl);
      const cls = classifyColor(dom.r, dom.g, dom.b);
      updateDraft({
        colorHex: dom.hex, colorLabel: cls.label, colorFamily: cls.family, colorHue: cls.hue, isNeutral: cls.isNeutral,
        uncertain: ['size', 'fit', 'subtype', 'pattern', 'season', 'material'],
      });
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAnalyze() {
    if (!dataUrl) return;
    setAnalyzing(true);
    setAiError('');
    try {
      const dom = await getDominantColor(dataUrl);
      const cls = classifyColor(dom.r, dom.g, dom.b);
      let next = { colorHex: dom.hex, colorLabel: cls.label, colorFamily: cls.family, colorHue: cls.hue, isNeutral: cls.isNeutral };
      const apiKey = localStorage.getItem('anthropic_api_key');
      const model = localStorage.getItem('anthropic_model');
      let uncertain = ['size', 'fit'];
      if (apiKey) {
        try {
          const ai = await analyzeItemImage(dataUrl, apiKey, model);
          next.subtype = ai.subtype || '';
          if (ai.colorHex) next.colorHex = ai.colorHex;
          next.colorLabel = ai.colorNameDe || next.colorLabel;
          next.pattern = ai.pattern || 'uni';
          next.season = Array.isArray(ai.season) ? ai.season : [];
          next.material = ai.material || '';
          if (ai.fitGuess) next.fit = ai.fitGuess;
          const conf = ai.confidence || {};
          Object.keys(conf).forEach((k) => { if (conf[k] < 0.6 && uncertain.indexOf(k) === -1) uncertain.push(k); });
          if (ai.category) next.category = ai.category;
        } catch (e) {
          setAiError(e.message + ' - bitte Angaben manuell pruefen.');
        }
      } else {
        setAiError('Kein API-Key hinterlegt - bitte Angaben manuell pruefen (Profil-Einstellungen).');
      }
      next.uncertain = uncertain;
      updateDraft(next);
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave(addAnother) {
    let colorFamily = draft.colorFamily, colorHue = draft.colorHue, isNeutral = draft.isNeutral;
    try {
      const rgb = hexToRgb(draft.colorHex);
      const cls = classifyColor(rgb.r, rgb.g, rgb.b);
      colorFamily = cls.family; colorHue = cls.hue; isNeutral = cls.isNeutral;
    } catch (e) {}
    const item = {
      id: crypto.randomUUID(),
      image: dataUrl,
      ...draft,
      colorFamily, colorHue, isNeutral,
      wornCount: 0,
      createdAt: Date.now(),
    };
    await db.addItem(item);
    setSavedFlash(true);
    setTimeout(() => {
      if (addAnother) {
        setStep(1); setDataUrl(null); setDraft(emptyDraft()); setAiError(''); setSavedFlash(false);
      } else {
        router.push('/');
      }
    }, 500);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Neues Teil</h1>
      </div>
      <div className="step-dots">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span key={i} className={'step-dot' + (i === step - 1 ? ' active' : '')} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="field">
            <label>Kategorie</label>
            <div className="pill-row">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" className={'pill' + (draft.category === c.key ? ' active' : '')}
                  onClick={() => updateDraft({ category: c.key })}>{c.label}</button>
              ))}
            </div>
          </div>

          {dataUrl ? (
            <img className="preview-img" src={dataUrl} alt="Vorschau" />
          ) : (
            <label className="upload-box">
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
              <span className="upload-icon">📷</span>
              Foto hochladen<br /><u>oder durchsuchen</u>
            </label>
          )}

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }}
            onClick={handleAnalyze} disabled={!dataUrl || analyzing}>
            {analyzing ? 'Analysiere...' : '✨ Mit KI analysieren'}
          </button>
          <button className="btn btn-block" style={{ marginTop: 10 }}
            onClick={handleManual} disabled={!dataUrl || analyzing}>
            Ohne KI manuell eintragen
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <img className="preview-img" src={dataUrl} alt="Vorschau" />
          {aiError && <div className="banner">{aiError}</div>}
          <div className="row">
            <div className="field">
              <label>Bezeichnung</label>
              <input type="text" value={draft.subtype} placeholder="z.B. Pullover" onChange={(e) => updateDraft({ subtype: e.target.value })} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Farbe {draft.uncertain?.includes('colorHex') && <span className="uncertain-badge">KI unsicher</span>}</label>
              <input type="text" value={draft.colorHex} onChange={(e) => updateDraft({ colorHex: e.target.value })} style={{ marginBottom: 6 }} />
              <input type="text" value={draft.colorLabel} placeholder="Farbname" onChange={(e) => updateDraft({ colorLabel: e.target.value })} />
            </div>
            <div className="field">
              <label>Muster</label>
              <div className="pill-row">
                {PATTERN_OPTIONS.map((p) => (
                  <button key={p} type="button" className={'pill' + (draft.pattern === p.toLowerCase() ? ' active' : '')}
                    onClick={() => updateDraft({ pattern: p.toLowerCase() })}>{p}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="field">
            <label>Saison</label>
            <div className="chip-group">
              {SEASON_OPTIONS.map((s) => (
                <span key={s} className={'chip' + (draft.season?.includes(s.toLowerCase()) ? ' selected' : '')}
                  onClick={() => toggleSeason(s.toLowerCase())}>{s}</span>
              ))}
            </div>
          </div>
          <div className="row">
            <button className="btn" onClick={() => setStep(1)}>Zurueck</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Weiter</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="card-sub" style={{ marginBottom: 16 }}>Das kann die KI von einem Foto nicht wissen - bitte kurz angeben:</p>
          <div className="row">
            <div className="field">
              <label>Groesse</label>
              <input type="text" value={draft.size} placeholder="z.B. M oder 38" onChange={(e) => updateDraft({ size: e.target.value })} />
            </div>
            <div className="field">
              <label>Fit / Passform</label>
              <div className="pill-row">
                {FIT_OPTIONS.map((f) => (
                  <button key={f} type="button" className={'pill' + (draft.fit === f ? ' active' : '')}
                    onClick={() => updateDraft({ fit: f })}>{f}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="field">
            <label>Material</label>
            <input type="text" value={draft.material} onChange={(e) => updateDraft({ material: e.target.value })} />
          </div>
          <div className="row">
            <button className="btn" onClick={() => setStep(2)}>Zurueck</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Weiter</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <img className="preview-img" src={dataUrl} alt="Vorschau" />
          <h2 style={{ marginTop: 0 }}>{draft.subtype || categoryLabel(draft.category)}</h2>
          <p className="card-sub"><span className="swatch" style={{ background: draft.colorHex }} /> {draft.colorLabel} - {categoryLabel(draft.category)}</p>
          <p className="card-sub">Groesse: {draft.size || '-'} - Fit: {draft.fit}</p>
          <div className="field">
            <label>Notizen (optional)</label>
            <textarea value={draft.notes} onChange={(e) => updateDraft({ notes: e.target.value })} />
          </div>
          <div className="row">
            <button className="btn" onClick={() => setStep(3)}>Zurueck</button>
            <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={savedFlash}>
              {savedFlash ? 'Gespeichert ✓' : 'Speichern'}
            </button>
          </div>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => handleSave(true)} disabled={savedFlash}>
            Speichern & weiteres Teil hinzufuegen
          </button>
        </div>
      )}
    </div>
  );
}
