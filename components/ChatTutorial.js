'use client';
import { useEffect, useRef, useState } from 'react';
import MockupShot from './MockupShot';
import { playReceive, playSend } from '../lib/chatSound';

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Script-gesteuerter WhatsApp-Stil-Chat: spielt Bot-Nachrichten automatisch ab,
// pausiert bei Fragen (Freitext oder Auswahl-Chips) bis der Nutzer antwortet,
// und zeigt zwischendurch kleine animierte App-Vorschauen (MockupShot).
// Schritt-Typen im "script"-Array:
//   { type: 'bot', text: string | (answers) => string }
//   { type: 'shot', shot: 'home'|'add'|'combine'|'community' }
//   { type: 'ask-text', key, placeholder }
//   { type: 'ask-choice', key, options: string[] }
export default function ChatTutorial({ script, online, typingLabel, sendLabel, onAnswer, onDone, doneLabel }) {
  const [shown, setShown] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [typing, setTyping] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [answers, setAnswers] = useState({});
  const scrollRef = useRef(null);

  const current = script[cursor];
  const finished = cursor >= script.length;

  useEffect(() => {
    if (!current || current.type === 'ask-text' || current.type === 'ask-choice') return;
    let cancelled = false;
    (async () => {
      setTyping(true);
      await wait(550 + Math.random() * 400);
      if (cancelled) return;
      setTyping(false);
      const bubble = current.type === 'shot'
        ? { kind: 'media', shot: current.shot }
        : { kind: 'bot', text: typeof current.text === 'function' ? current.text(answers) : current.text };
      setShown((prev) => [...prev, bubble]);
      playReceive();
      await wait(280);
      if (cancelled) return;
      setCursor((c) => c + 1);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [shown, typing, current]);

  function submitText() {
    const val = textValue.trim();
    if (!val || !current) return;
    setShown((prev) => [...prev, { kind: 'user', text: val }]);
    setAnswers((a) => ({ ...a, [current.key]: val }));
    onAnswer && onAnswer(current.key, val);
    playSend();
    setTextValue('');
    setCursor((c) => c + 1);
  }

  function submitChoice(opt) {
    if (!current) return;
    setShown((prev) => [...prev, { kind: 'user', text: opt }]);
    setAnswers((a) => ({ ...a, [current.key]: opt }));
    onAnswer && onAnswer(current.key, opt);
    playSend();
    setCursor((c) => c + 1);
  }

  const waitingForText = !typing && current && current.type === 'ask-text';
  const waitingForChoice = !typing && current && current.type === 'ask-choice';

  return (
    <div className="chat-tutorial">
      <div className="chat-header">
        <span className="chat-avatar">🧺</span>
        <div>
          <div className="chat-header-name">MyClo Assistent</div>
          <div className="chat-header-status">{typing ? typingLabel : online}</div>
        </div>
      </div>
      <div className="chat-body" ref={scrollRef}>
        {shown.map((m, i) => {
          if (m.kind === 'media') {
            return <div key={i} className="chat-bubble chat-bubble-media"><MockupShot type={m.shot} /></div>;
          }
          if (m.kind === 'user') {
            return <div key={i} className="chat-bubble chat-bubble-user">{m.text}</div>;
          }
          return <div key={i} className="chat-bubble">{m.text}</div>;
        })}
        {typing && (
          <div className="chat-bubble typing">
            <span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" />
          </div>
        )}
        {waitingForChoice && (
          <div className="chat-choices">
            {current.options.map((opt) => (
              <button key={opt} type="button" className="chat-choice-btn" onClick={() => submitChoice(opt)}>{opt}</button>
            ))}
          </div>
        )}
      </div>
      {waitingForText ? (
        <div className="chat-input-row">
          <input
            type="text"
            value={textValue}
            placeholder={current.placeholder}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitText(); }}
            autoFocus
          />
          <button type="button" className="chat-send-btn" title={sendLabel} onClick={submitText} disabled={!textValue.trim()}>➤</button>
        </div>
      ) : (
        <div className="chat-footer">
          <button className="btn-mono" onClick={onDone} disabled={!finished}>{doneLabel}</button>
        </div>
      )}
    </div>
  );
}
