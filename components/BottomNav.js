'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconPerson, IconPlus } from './Icons';

// "Kombinieren" ist vorerst raus (kommt nach ein paar Updates in neuer Form zurueck).
const LEFT = [
  { href: '/', icon: '🧺', label: 'Schrank' },
];
const RIGHT = [
  { href: '/gallery', icon: '🖼️', label: 'Community' },
  { href: '/profil', icon: <IconPerson size={20} />, label: 'Profil' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {LEFT.map((l) => (
        <Link key={l.href} href={l.href} className={'bottom-nav-item' + (pathname === l.href ? ' active' : '')}>
          <span className="bottom-nav-icon">{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
      <Link href="/add" className="bottom-nav-fab" aria-label="Teil hinzufuegen"><IconPlus size={24} /></Link>
      {RIGHT.map((l) => (
        <Link key={l.href} href={l.href} className={'bottom-nav-item' + (pathname === l.href ? ' active' : '')}>
          <span className="bottom-nav-icon">{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
