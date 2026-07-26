import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'Mein Kleiderschrank',
  description: 'Digitaler Kleiderschrank mit KI-Erkennung und Outfit-Generator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
