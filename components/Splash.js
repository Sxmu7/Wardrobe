'use client';
import { useEffect, useState } from 'react';

const WORD = 'MyClo';
const TYPE_SPEED = 110;

export default function Splash({ onDone }) {
  const [typed, setTyped] = useState('');
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    let i = 0;
    const typeTimer = setInterval(() => {
      i += 1;
      setTyped(WORD.slice(0, i));
      if (i >= WORD.length) {
        clearInterval(typeTimer);
        setTimeout(() => setShowTagline(true), 200);
      }
    }, TYPE_SPEED);

    const doneTimer = setTimeout(() => onDone(), WORD.length * TYPE_SPEED + 1500);

    return () => { clearInterval(typeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className="splash">
      <div className="splash-logo">
        {typed}
        <span className="splash-cursor">|</span>
      </div>
      <div className={'splash-tagline' + (showTagline ? ' show' : '')}>designed and developed by SXMU</div>
    </div>
  );
}
