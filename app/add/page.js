'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fileToResizedDataUrl } from '../../lib/image';
import { getDominantColor, classifyColor, hexToRgb } from '../../lib/color';
import { analyzeItemImage } from '../../lib/ai';
import { classifyImageFree } from '../../lib/classify';
import { CATEGORIES, FIT_OPTIONS, PATTERN_OPTIONS, SEASON_OPTIONS, COLOR_SWATCHES, categoryLabel, categoryIcon } from '../../lib/constants';
import { db } from '../../lib/db';
import { IconCamera, IconCheck } from '../../components/Icons';

function emptyDraft() {
  return {
    category: 'oberteil', subtype: '', colorHex: '#9b9b9b', colorLabel: 'Grau', colorFamily: 'grau', colorHue: 0, isNeutral: true,
    pattern: 'uni', season: [], material: '', brand: '', size: '', price: '', fit: 'Unbekannt', notes: '', uncertain: [],
  };
}

const CHECK_STEPS = [
  { key: 'colorHex', label: 'Farbe erkannt' },
  { key: 'category', label: 'Kategorie erkannt' },
  { key: 'pattern', label: 'Muster erkannt' },
  { key: 'season', label: 'Saison wird bestimmt' },
];

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

export default function AddItemPage() {
  const router = useRouter();
  const [phase, setPhase] = useState('form'); // form -> analyzing -> confirm -> saved
  const [dataUrl, setDataUrl] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [checks, setChecks] = useState({});
  const [aiError, setAiError] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  function updateDraft(patch) { setDraft((d) => ({ ...d, ...patch })); }
  function toggleSeason(s) {
    const cur = draft.season || [];
    updateDraft({ season: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  }
  function pickColor(swatch) {
    updateDraft({ colorHex: swatch.hex, colorLabel: swatch.label, colorFamily: swatch.family, colorHue: swatch.hue, isNeutral: swatch.isNeutral });
    setShowColorPicker(false);
  }

  async function handleFile(file) {
    const url = await fileToResizedDataUrl(file);
    setDataUrl(url);
  }

  async function runAnalysis(withAI) {
    if (!dataUrl) return;
    setPhase('analyzing');
    setAiError('');
    setChecks({});

    const dom = await getDominantColor(dataUrl);
    const cls = classifyColor(dom.r, dom.g, dom.b);
    updateDraft({ colorHex: dom.hex, colorLabel: cls.label, colorFamily: cls.family, colorHue: cls.hue, isNeutral: cls.isNeutral });
    setChecks((c) => ({ ...c, colorHex: true }));
    await wait(300);

    let uncertain = ['size', 'fit', 'brand'];
    const apiKey = localStorage.getItem('anthropic_api_key');
    const model = localStorage.getItem('anthropic_model');

    if (withAI && apiKey) {
      // Genauere, kostenpflichtige Erkennung ueber den hinterlegten Anthropic-Key.
      try {
        const aiResult = await analyzeItemImage(dataUrl, apiKey, model);
        updateDraft({
          category: aiResult.category || draft.category,
          subtype: aiResult.subtype || '',
          pattern: aiResult.pattern || 'uni',
          season: Array.isArray(aiResult.season) ? aiResult.season : [],
          material: aiResult.material || '',
          fit: aiResult.fitGuess || draft.fit,
        });
        if (aiResult.colorHex) {
          const rgb = hexToRgb(aiResult.colorHex);
          const c2 = classifyColor(rgb.r, rgb.g, rgb.b);
          updateDraft({ colorHex: aiResult.colorHex, colorLabel: aiResult.colorNameDe || c2.label, colorFamily: c2.family, colorHue: c2.hue, isNeutral: c2.isNeutral });
        }
        const conf = aiResult.confidence || {};
        Object.keys(conf).forEach((k) => { if (conf[k] < 0.6 && uncertain.indexOf(k) === -1) uncertain.push(k); });
      } catch (e) {
        setAiError(e.message + ' - bitte Angaben manuell pruefen.');
        uncertain = uncertain.concat(['category', 'subtype', 'pattern', 'season']);
      }
    } else if (withAI) {
      // Standard: kostenlose Erkennung direkt im Browser, kein API-Key noetig.
      try {
        const free = await classifyImageFree(dataUrl);
        if (free.category) updateDraft({ category: free.category });
        if (free.subtype) updateDraft({ subtype: free.subtype });
        uncertain = uncertain.concat(['pattern', 'season', 'material']);
        if (!free.category || free.confidence < 0.35) uncertain = uncertain.concat(['category', 'subtype']);
        setAiError('Kostenlose Bilderkennung (laeuft im Browser) - bitte Angaben kurz pruefen. Fuer praezisere Ergebnisse: optionaler API-Key im Profil.');
      } catch (e) {
        setAiError('Kostenlose Bilderkennung gerade nicht verfuegbar - bitte Angaben manuell eintragen.');
        uncertain = uncertain.concat(['category', 'subtype', 'pattern', 'season']);
      }
    } else {
      uncertain = uncertain.concat(['category', 'subtype', 'pattern', 'season']);
    }

    setChecks((c) => ({ ...c, category: true }));
    await wait(280);
    setChecks((c) => ({ ...c, pattern: true }));
    await wait(280);
    setChecks((c) => ({ ...c, season: true }));
    updateDraft({ uncertain });
    await wait(450);
    setPhase('confirm');
  }

  async function handleSave() {
    let colorFamily = draft.colorFamily, colorHue = draft.colorHue, isNeutral = draft.isNeutral;
    const item = {
      id: crypto.randomUUID(),
      image: dataUrl,
      ...draft,
      colorFamily, colorHue, isNeutral,
      wornCount: 0,
      isFavorite: false,
      createdAt: Date.now(),
    };
    await db.addItem(item);
    setPhase('saved');
    setTimeout(() => router.push('/'), 1300);
  }

  function addAnother() {
    setPhase('form'); setDataUrl(null); setDraft(emptyDraft()); setAiError(''); setChecks({});
  }

  return (
    <div>
      <div className="page-header">
        <h1>Neues Teil</h1>
      </div>

      {phase === 'form' && (
        <div>
          <div className="field">
            <label>Kategorie</label>
            <div className="pill-row">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" className={'pill' + (draft.category === c.key ? ' active' : '')}
                  onClick={() => updateDraft({ category: c.key })}>{c.icon} {c.label}</button>
              ))}
            </div>
          </div>

          {dataUrl ? (
            <img className="preview-img" src={dataUrl} alt="Vorschau" />
          ) : (
            <label className="upload-box">
              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
              <span className="upload-icon"><IconCamera size={28} /></span>
              Foto aufnehmen oder hochladen
            </label>
          )}

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }}
            onClick={() => runAnalysis(true)} disabled={!dataUrl}>
            ✨ Mit KI analysieren
          </button>
          <button className="btn btn-block" style={{ marginTop: 10 }}
            onClick={() => runAnalysis(false)} disabled={!dataUrl}>
            Ohne KI manuell eintragen
          </button>
          <p className="card-sub" style={{ textAlign: 'center', marginTop: 10 }}>
            Kostenlose Bilderkennung inklusive – kein API-Key noetig. Fuer praezisere Ergebnisse kannst du optional einen Anthropic-Key im Profil hinterlegen.
          </p>
        </div>
      )}

      {phase === 'analyzing' && (
        <div>
          <img className="preview-img" src={dataUrl} alt="Vorschau" />
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 4 }}>Dein Kleidungsstueck wird analysiert</p>
          <div className="check-list">
            {CHECK_STEPS.map((s) => (
              <div key={s.key} className={'check-item' + (checks[s.key] ? ' done' : ' spin')}>
                <span className="check-icon">{checks[s.key] ? '✓' : '○'}</span>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'confirm' && (
        <div>
          <img className="preview-img" src={dataUrl} alt="Vorschau" />
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            Wir haben {draft.isNeutral ? 'einen' : 'einen'} {draft.colorLabel?.toLowerCase()} {(draft.subtype || categoryLabel(draft.category)).toLowerCase()} erkannt.
          </p>
          {aiError && <div className="banner">{aiError}</div>}

          <div className="field">
            <label>Kategorie</label>
            <div className="pill-row">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" className={'pill' + (draft.category === c.key ? ' active' : '')}
                  onClick={() => updateDraft({ category: c.key })}>{c.icon} {c.label}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Bezeichnung {draft.uncertain?.includes('subtype') && <span className="uncertain-badge">bitte pruefen</span>}</label>
            <input type="text" value={draft.subtype} placeholder="z.B. Pullover" onChange={(e) => updateDraft({ subtype: e.target.value })} />
          </div>

          <div className="field">
            <label>Farbe {draft.uncertain?.includes('colorHex') && <span className="uncertain-badge">bitte pruefen</span>}</label>
            <div className="color-preview-row" onClick={() => setShowColorPicker((v) => !v)} style={{ cursor: 'pointer' }}>
              <span className="color-preview-swatch" style={{ background: draft.colorHex }} />
              <span>{draft.colorLabel}</span>
              <span className="card-sub" style={{ marginLeft: 'auto' }}>Farbe aendern ›</span>
            </div>
            {showColorPicker && (
              <div className="swatch-grid">
                {COLOR_SWATCHES.map((s) => (
                  <button key={s.family} type="button" className={'swatch-option' + (draft.colorFamily === s.family ? ' active' : '')}
                    onClick={() => pickColor(s)}>
                    <span className="swatch-circle" style={{ background: s.hex }} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="field">
            <label>Muster {draft.uncertain?.includes('pattern') && <span className="uncertain-badge">bitte pruefen</span>}</label>
            <div className="pill-row">
              {PATTERN_OPTIONS.map((p) => (
                <button key={p} type="button" className={'pill' + (draft.pattern === p.toLowerCase() ? ' active' : '')}
                  onClick={() => updateDraft({ pattern: p.toLowerCase() })}>{p}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Fit {draft.uncertain?.includes('fit') && <span className="uncertain-badge">bitte pruefen</span>}</label>
            <div className="pill-row">
              {FIT_OPTIONS.map((f) => (
                <button key={f} type="button" className={'pill' + (draft.fit === f ? ' active' : '')}
                  onClick={() => updateDraft({ fit: f })}>{f}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Saison {draft.uncertain?.includes('season') && <span className="uncertain-badge">bitte pruefen</span>}</label>
            <div className="chip-group">
              {SEASON_OPTIONS.map((s) => (
                <span key={s} className={'chip' + (draft.season?.includes(s.toLowerCase()) ? ' selected' : '')}
                  onClick={() => toggleSeason(s.toLowerCase())}>{s}</span>
              ))}
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Groesse</label>
              <input type="text" value={draft.size} placeholder="z.B. M oder 38" onChange={(e) => updateDraft({ size: e.target.value })} />
            </div>
            <div className="field">
              <label>Marke</label>
              <input type="text" value={draft.brand} placeholder="optional" onChange={(e) => updateDraft({ brand: e.target.value })} />
            </div>
          </div>

          <div className="field">
            <label>Kaufpreis (optional)</label>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={draft.price}
              placeholder="z.B. 39.90" onChange={(e) => updateDraft({ price: e.target.value })} />
          </div>

          <div className="field">
            <label>Notiz (optional)</label>
            <textarea value={draft.notes} onChange={(e) => updateDraft({ notes: e.target.value })} />
          </div>

          <div className="row">
            <button className="btn" onClick={addAnother}>Abbrechen</button>
            <button className="btn btn-primary" onClick={handleSave}>Speichern</button>
          </div>
        </div>
      )}

      {phase === 'saved' && (
        <div className="success-overlay">
          <div className="success-badge">
            <IconCheck size={56} />
          </div>
          <p className="success-text">Gespeichert!</p>
        </div>
      )}
    </div>
  );
}
