'use client';
import { useEffect, useRef, useState } from 'react';

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

export default function ChatTutorial({ messages, online, typingLabel, onDone, doneLabel }) {
  const [shown, setShown] = useState([]);
  const [typing, setTyping] = useState(false);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      for (let i = 0; i < messages.length; i++) {
        setTyping(true);
        await wait(650 + Math.random() * 450);
        if (cancelled) return;
        setTyping(false);
        setShown((prev) => [...prev, messages[i]]);
        await wait(320);
        if (cancelled) return;
      }
      setFinished(true);
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [shown, typing]);

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
        {shown.map((m, i) => (
          <div key={i} className="chat-bubble">{m}</div>
        ))}
        {typing && (
          <div className="chat-bubble typing">
            <span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" />
          </div>
        )}
      </div>
      <div className="chat-footer">
        <button className="btn-mono" onClick={onDone} disabled={!finished}>{doneLabel}</button>
      </div>
    </div>
  );
}
