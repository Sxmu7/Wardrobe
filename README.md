# Mein Kleiderschrank

Next.js-App: digitaler Kleiderschrank mit KI-Erkennung (Anthropic Vision) und Outfit-Generator.

## Lokal starten

```
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Deploy zu Vercel

Kein Vercel-Dashboard-Zip-Upload nötig – am einfachsten per CLI:

```
npm install -g vercel
cd mein-kleiderschrank-app
vercel
```

Den Anweisungen folgen (Account verknüpfen, Projekt anlegen). Für ein Production-Deployment danach:

```
vercel --prod
```

Alternativ: Ordner in ein neues GitHub-Repo pushen und das Repo in Vercel importieren (vercel.com/new).

## API-Key

Kein Environment-Variable-Setup nötig. Jede Nutzerin/jeder Nutzer trägt den eigenen Anthropic API-Key direkt in der App unter "Einstellungen" ein. Der Key wird nur im Browser (localStorage) gespeichert und bei Bedarf an die serverseitige Route `/api/analyze` gesendet, die ihn 1:1 an die Anthropic API weiterreicht (kein Speichern auf dem Server).

## Struktur

- `app/` – Next.js App Router Seiten (Kleiderschrank, Outfits, Outfit-Fotos, Einstellungen)
- `app/api/analyze/route.js` – Server-Route, die Bilder zur KI-Analyse an Anthropic weiterleitet
- `lib/` – IndexedDB-Datenlayer, Farb-Matching-Logik, Bild-Resizing, KI-Client
- `components/` – UI-Bausteine (Nav, Upload-Flow, Item-Karten/-Detail)

Daten (Fotos, Outfits) werden im Browser des jeweiligen Geräts gespeichert (IndexedDB), nicht in einer zentralen Datenbank.
