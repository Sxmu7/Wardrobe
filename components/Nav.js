'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Kleiderschrank' },
  { href: '/outfits', label: 'Outfits' },
  { href: '/gallery', label: 'Outfit-Fotos' },
  { href: '/settings', label: 'Einstellungen' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <span className="nav-brand">Mein Kleiderschrank</span>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={'nav-link' + (pathname === l.href ? ' active' : '')}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
