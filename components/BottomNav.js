'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconPerson } from './Icons';

const LEFT = [
  { href: '/', icon: '🧺', label: 'Schrank' },
  { href: '/outfits', icon: '🔀', label: 'Kombinieren' },
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
      <Link href="/add" className="bottom-nav-fab" aria-label="Teil hinzufuegen">+</Link>
      {RIGHT.map((l) => (
        <Link key={l.href} href={l.href} className={'bottom-nav-item' + (pathname === l.href ? ' active' : '')}>
          <span className="bottom-nav-icon">{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
