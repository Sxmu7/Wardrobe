import './globals.css';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'MyClo',
  description: 'MyClo – dein intelligenter, digitaler Kleiderschrank mit KI-Erkennung und Outfit-Matching',
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
