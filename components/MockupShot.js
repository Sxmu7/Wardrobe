'use client';

// Kleine, selbst gezeichnete Vorschau-Mockups der App-Screens (kein echtes
// Screenshot-Rendering noetig) mit animiertem Pfeil auf die wichtigste Aktion -
// fuer den interaktiven Chat-Tutorial im Onboarding.

function Frame({ children }) {
  return (
    <svg viewBox="0 0 260 180" className="mockup-shot" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="258" height="178" rx="18" fill="#F8F8F7" stroke="#E4E4E1" strokeWidth="2" />
      {children}
    </svg>
  );
}

function Arrow({ x1, y1, x2, y2, curve }) {
  const path = curve || `M${x1},${y1} Q${(x1 + x2) / 2 + 18},${(y1 + y2) / 2} ${x2},${y2}`;
  return (
    <g className="mockup-arrow">
      <path d={path} fill="none" stroke="#FF9F0A" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 5" />
      <circle cx={x2} cy={y2} r="5" fill="#FF9F0A" />
    </g>
  );
}

export default function MockupShot({ type }) {
  if (type === 'add') {
    return (
      <Frame>
        <rect x="16" y="14" width="130" height="90" rx="10" fill="#E7E4DC" />
        <path d="M62,60 L81,42 L100,60" fill="none" stroke="#B0AA9B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="16" y="112" width="130" height="10" rx="5" fill="#E4E4E1" />
        <rect x="16" y="128" width="90" height="10" rx="5" fill="#E4E4E1" />
        <rect x="158" y="26" width="86" height="26" rx="13" fill="#111111" />
        <text x="201" y="43" textAnchor="middle" fontSize="10" fill="#F8F8F7" fontFamily="sans-serif" fontWeight="700">Mit KI analysieren</text>
        <Arrow x1="230" y1="70" x2="215" y2="52" />
      </Frame>
    );
  }
  if (type === 'combine') {
    return (
      <Frame>
        <rect x="16" y="16" width="228" height="30" rx="9" fill="#E7E4DC" />
        <rect x="16" y="52" width="140" height="30" rx="9" fill="#E7E4DC" />
        <rect x="16" y="88" width="180" height="30" rx="9" fill="#E7E4DC" />
        <rect x="60" y="132" width="140" height="30" rx="15" fill="url(#g1)" />
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#AF52DE" />
            <stop offset="1" stopColor="#5E5CE6" />
          </linearGradient>
        </defs>
        <text x="130" y="151" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="sans-serif" fontWeight="700">✨ KI-Vorschlag</text>
        <Arrow x1="230" y1="112" x2="196" y2="146" />
      </Frame>
    );
  }
  if (type === 'community') {
    return (
      <Frame>
        <rect x="16" y="14" width="228" height="120" rx="12" fill="#E7E4DC" />
        <path d="M70,80 L120,120 L190,50" fill="none" stroke="#C7C2B4" strokeWidth="0" />
        <circle cx="205" cy="34" r="16" fill="#fff" opacity="0.9" />
        <path d="M205,29 C201,23 193,25 193,32 C193,38 205,44 205,44 C205,44 217,38 217,32 C217,25 209,23 205,29 Z" fill="#FF453A" />
        <rect x="16" y="146" width="120" height="10" rx="5" fill="#E4E4E1" />
        <Arrow x1="180" y1="20" x2="205" y2="34" />
      </Frame>
    );
  }
  // 'home' (default)
  return (
    <Frame>
      <rect x="16" y="14" width="228" height="20" rx="10" fill="#E7E4DC" />
      <rect x="16" y="44" width="228" height="60" rx="12" fill="url(#g2)" />
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D9A45C" />
          <stop offset="1" stopColor="#B3402F" />
        </linearGradient>
      </defs>
      <rect x="16" y="114" width="52" height="52" rx="10" fill="#E7E4DC" />
      <rect x="76" y="114" width="52" height="52" rx="10" fill="#E7E4DC" />
      <rect x="136" y="114" width="52" height="52" rx="10" fill="#E7E4DC" />
      <circle cx="222" cy="150" r="20" fill="#111111" />
      <path d="M222,142 L222,158 M214,150 L230,150" stroke="#F8F8F7" strokeWidth="3" strokeLinecap="round" />
      <Arrow x1="180" y1="176" x2="216" y2="164" />
    </Frame>
  );
}
