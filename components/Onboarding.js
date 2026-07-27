'use client';
import { useState } from 'react';
import { LANGUAGES, t } from '../lib/i18n';
import { createProfileRemote, setCurrentProfile } from '../lib/profile';
import { lookupProfileByCode } from '../lib/sync';
import { pullAllRemoteToLocal } from '../lib/accountSync';
import ChatTutorial from './ChatTutorial';

const FLAGS = { de: '🇩🇪', en: '🇬🇧', es: '🇪🇸' };

function buildScript(lang) {
  return [
    { type: 'bot', text: t(lang, 'chatGreet1') },
    { type: 'bot', text: t(lang, 'chatGreet2') },
    { type: 'bot', text: t(lang, 'askName') },
    { type: 'ask-text', key: 'name', placeholder: t(lang, 'namePlaceholder') },
    { type: 'bot', text: (a) => t(lang, 'chatAfterName').replace('{name}', a.name || '') },
    { type: 'bot', text: t(lang, 'chatSourceQuestion') },
    { type: 'ask-choice', key: 'source', options: t(lang, 'chatSourceOptions') },
    { type: 'bot', text: t(lang, 'chatSourceThanks') },
    { type: 'bot', text: t(lang, 'chatExplainIntro') },
    { type: 'bot', text: t(lang, 'chatExplainHome') },
    { type: 'shot', shot: 'home' },
    { type: 'bot', text: t(lang, 'chatExplainAdd') },
    { type: 'shot', shot: 'add' },
    { type: 'bot', text: t(lang, 'chatReady') },
  ];
}

export default function Onboarding({ onComplete }) {
  const [lang, setLang] = useState(null);
  const [view, setView] = useState('chat'); // 'chat' | 'code'
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [syncing, setSyncing] = useState(false);

  async function handleAnswer(key, value) {
    if (key === 'name') {
      const trimmed = value.trim();
      try {
        const profile = await createProfileRemote(trimmed);
        setCurrentProfile(profile.id, profile.name);
      } catch (e) {
        // Kein Server/DB erreichbar (z.B. Postgres noch nicht eingerichtet) -
        // App trotzdem nutzbar machen, Freunde-Feature synct spaeter automatisch.
        setCurrentProfile(null, trimmed);
        localStorage.setItem('kleiderschrank_profile_pending', '1');
      }
    }
    if (key === 'source') {
      try { localStorage.setItem('kleiderschrank_signup_source', value); } catch (e) {}
    }
  }

  async function handleCodeContinue() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setSyncing(true);
    setError('');
    try {
      const profile = await lookupProfileByCode(trimmed);
      setCurrentProfile(profile.id, profile.name);
      await pullAllRemoteToLocal(profile.id);
      finish();
    } catch (e) {
      setError(t(lang, 'accountCodeNotFound'));
    } finally {
      setSyncing(false);
    }
  }

  function finish() {
    localStorage.setItem('kleiderschrank_onboarding_done', '1');
    onComplete();
  }

  if (!lang) {
    return (
      <div className="onboarding">
        <div className="onboarding-glow" />
        <div className="onboarding-notch" />
        <div className="onboarding-brand">MyClo</div>
        <div className="onboarding-body">
          <div className="onboarding-icon-badge">🌍</div>
          <h1 className="onboarding-title">Sprache / Language / Idioma</h1>
          <p className="onboarding-text">Wähle deine Sprache, um MyClo einzurichten.</p>
          <div className="lang-list">
            {LANGUAGES.map((l) => (
              <button key={l.code} className="btn-mono" onClick={() => setLang(l.code)}>
                <span>{FLAGS[l.code]}</span>{l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="onboarding-footer">designed and developed by SXMU</div>
      </div>
    );
  }

  if (view === 'code') {
    return (
      <div className="onboarding">
        <div className="onboarding-glow" />
        <div className="onboarding-notch" />
        <div className="onboarding-body">
          <div className="onboarding-icon-badge">🔑</div>
          <h1 className="onboarding-title">{t(lang, 'accountCodeTitle')}</h1>
          <div className="field">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              placeholder={t(lang, 'accountCodePlaceholder')}
              onChange={(e) => setCode(e.target.value)}
              style={{ textAlign: 'center', fontSize: 22, letterSpacing: 2 }}
              autoFocus
            />
          </div>
          {syncing && <p className="onboarding-text">{t(lang, 'accountCodeSyncing')}</p>}
          {error && <div className="banner">{error}</div>}
        </div>
        <div className="onboarding-actions">
          <button className="btn-mono" onClick={handleCodeContinue} disabled={!code.trim() || syncing}>
            {syncing ? '...' : t(lang, 'accountCodeContinue')}
          </button>
          <button className="onboarding-link" onClick={() => { setView('chat'); setError(''); }}>
            {t(lang, 'accountCodeBack')}
          </button>
        </div>
        <div className="onboarding-footer">MyClo · designed and developed by SXMU</div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding-glow" />
      <div className="onboarding-notch" />
      <button className="onboarding-link" style={{ marginBottom: 6, flex: 'none' }}
        onClick={() => { setView('code'); setError(''); }}>
        {t(lang, 'haveAccount')}
      </button>
      <ChatTutorial
        script={buildScript(lang)}
        online={t(lang, 'chatOnline')}
        typingLabel={t(lang, 'chatTyping')}
        sendLabel={t(lang, 'chatSend')}
        onAnswer={handleAnswer}
        onDone={finish}
        doneLabel={t(lang, 'getStarted')}
      />
      <button className="btn-mono-outline" onClick={finish} style={{ marginTop: 10, flex: 'none' }}>{t(lang, 'skip')}</button>
    </div>
  );
}
