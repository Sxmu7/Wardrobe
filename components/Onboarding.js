'use client';
import { useState } from 'react';
import { LANGUAGES, t } from '../lib/i18n';
import { createProfileRemote, setCurrentProfile } from '../lib/profile';

const EXPLAIN_STEPS = [
  { emoji: '🧺', titleKey: 'step1Title', bodyKey: 'step1Body' },
  { emoji: '🔀', titleKey: 'step2Title', bodyKey: 'step2Body' },
  { emoji: '🖼️', titleKey: 'step3Title', bodyKey: 'step3Body' },
];

export default function Onboarding({ onComplete }) {
  const [lang, setLang] = useState(null);
  const [name, setName] = useState('');
  const [step, setStep] = useState(0); // 0 = name entry, 1..3 = explain steps
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleNameContinue() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError('');
    try {
      const profile = await createProfileRemote(trimmed);
      setCurrentProfile(profile.id, profile.name);
      setStep(1);
    } catch (e) {
      setError(e.message || 'Profil konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  }

  function finish() {
    localStorage.setItem('kleiderschrank_onboarding_done', '1');
    onComplete();
  }

  if (!lang) {
    return (
      <div className="onboarding">
        <div className="onboarding-notch" />
        <div className="onboarding-body">
          <div className="onboarding-emoji">🌍</div>
          <h1 className="onboarding-title">Sprache / Language / Idioma</h1>
          <div className="lang-list">
            {LANGUAGES.map((l) => (
              <button key={l.code} className="btn-mono" onClick={() => setLang(l.code)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 4; // name + 3 explain steps
  const progressPct = ((step + 1) / totalSteps) * 100;

  if (step === 0) {
    return (
      <div className="onboarding">
        <div className="onboarding-notch" />
        <div className="progress-track"><div className="progress-fill" style={{ width: progressPct + '%' }} /></div>
        <div className="step-dots">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span key={i} className={'step-dot' + (i === step ? ' active' : '')} />
          ))}
        </div>
        <div className="onboarding-body">
          <div className="onboarding-emoji">👋</div>
          <h1 className="onboarding-title">{t(lang, 'askName')}</h1>
          <p className="onboarding-text">{t(lang, 'nameHint')}</p>
          <div className="field">
            <input
              type="text"
              value={name}
              placeholder={t(lang, 'namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
              style={{ textAlign: 'center', fontSize: 16 }}
              autoFocus
            />
          </div>
          {error && <div className="banner">{error}</div>}
        </div>
        <div className="onboarding-actions">
          <button className="btn-mono" onClick={handleNameContinue} disabled={!name.trim() || saving}>
            {saving ? '...' : t(lang, 'continue')}
          </button>
        </div>
      </div>
    );
  }

  const explain = EXPLAIN_STEPS[step - 1];
  const isLast = step === totalSteps - 1;

  return (
    <div className="onboarding">
      <div className="onboarding-notch" />
      <div className="progress-track"><div className="progress-fill" style={{ width: progressPct + '%' }} /></div>
      <div className="step-dots">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span key={i} className={'step-dot' + (i === step ? ' active' : '')} />
        ))}
      </div>
      <div className="onboarding-body">
        <div className="onboarding-emoji">{explain.emoji}</div>
        <h1 className="onboarding-title">{t(lang, explain.titleKey)}</h1>
        <p className="onboarding-text">{t(lang, explain.bodyKey)}</p>
      </div>
      <div className="onboarding-actions">
        {isLast ? (
          <button className="btn-mono" onClick={finish}>{t(lang, 'getStarted')}</button>
        ) : (
          <button className="btn-mono" onClick={() => setStep(step + 1)}>{t(lang, 'continue')}</button>
        )}
        {!isLast && (
          <button className="btn-mono-outline" onClick={finish}>{t(lang, 'skip')}</button>
        )}
      </div>
    </div>
  );
}
