'use client';
import { useEffect, useState } from 'react';

export default function Splash({ onDone }) {
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTagline(true), 750);
    const t2 = setTimeout(() => onDone(), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className="splash">
      <div className="splash-logo">MyClo</div>
      <div className={'splash-tagline' + (showTagline ? ' show' : '')}>designed and developed by SXMU</div>
    </div>
  );
}
