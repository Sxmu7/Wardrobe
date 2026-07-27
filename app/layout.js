import './globals.css';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'MyClo',
  description: 'MyClo – dein intelligenter, digitaler Kleiderschrank mit KI-Erkennung und Outfit-Matching',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MyClo' },
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon.svg' },
};

export const viewport = {
  themeColor: '#171717',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
