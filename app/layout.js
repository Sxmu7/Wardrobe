import './globals.css';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'Mein Kleiderschrank',
  description: 'Digitaler Kleiderschrank mit KI-Erkennung und Outfit-Generator',
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
