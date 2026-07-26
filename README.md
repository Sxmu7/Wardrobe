# MyClo

Next.js-App: digitaler Kleiderschrank mit KI-Erkennung (Anthropic Vision) oder manueller Eingabe, Trage-Zähler, Outfit-Moodboard-Generator, Onboarding (DE/EN/ES) und einer simulierten Community mit Likes (ohne Login). Designed and developed by SXMU.

## Wichtig: Datenbank einrichten (einmalig, in Vercel)

Freunde-Profile, geteilte Outfit-Fotos und Likes werden zentral gespeichert (nicht nur lokal im Browser) – dafür braucht das Projekt eine Postgres-Datenbank von Vercel:

1. Projekt zu Vercel deployen (siehe unten) oder ein bestehendes Projekt öffnen.
2. Im Vercel-Dashboard: Projekt öffnen → Tab **Storage** → **Create Database** → **Postgres** (powered by Neon) auswählen → kostenlosen Hobby-Plan bestätigen.
3. Die Datenbank direkt mit diesem Projekt verknüpfen ("Connect to Project") – Vercel setzt die nötigen Umgebungsvariablen (`POSTGRES_URL` etc.) automatisch.
4. Neu deployen (oder beim nächsten Push passiert das automatisch) – die Tabellen (`profiles`, `outfit_photos`, `outfit_likes`) werden beim ersten Aufruf automatisch angelegt (kein manuelles Migrationsskript nötig).

Für lokale Entwicklung: `vercel env pull .env.local` nach dem Verknüpfen ausführen, dann `npm run dev`.

## Lokal starten

```
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Deploy zu Vercel

Kein Zip-Upload nötig – am einfachsten per CLI:

```
npm install -g vercel
cd mein-kleiderschrank-app
vercel
```

Für ein Production-Deployment danach:

```
vercel --prod
```

Alternativ: Ordner in ein neues GitHub-Repo pushen und das Repo in Vercel importieren (vercel.com/new).

## API-Key (KI-Bilderkennung)

Kein Environment-Variable-Setup nötig. Jede Person trägt ihren eigenen Anthropic API-Key direkt in der App unter "Profil" ein. Der Key wird nur im Browser (localStorage) gespeichert und bei Bedarf an die serverseitige Route `/api/analyze` gesendet, die ihn 1:1 an die Anthropic API weiterreicht (kein Speichern auf dem Server).

## Profile & Freunde (ohne echten Login)

Beim ersten Öffnen durchläuft man ein kurzes Intro (Sprache wählen, Name eingeben, Kurz-Erklärung). Der eingegebene Name legt ein Profil in der Datenbank an (`profiles`-Tabelle) – ohne Passwort. Über "Profil → Profil wechseln" kann zwischen mehreren Profilen (z.B. für Testzwecke oder echte Freunde am selben Gerät) gewechselt werden. Jedes Profil sieht die Outfit-Fotos aller anderen Profile im "Von Freunden"-Feed und kann sie liken.

Wichtiger Hinweis: Da es keine Passwort-Authentifizierung gibt, kann sich technisch jede Person als jedes Profil ausgeben, wenn sie dessen Profil-ID kennt (sie wird nur im localStorage des jeweiligen Geräts gespeichert). Für einen kleinen, vertrauten Freundeskreis ist das meist ausreichend – für einen produktiven Mehrbenutzer-Einsatz mit echtem Datenschutz wäre ein echtes Login-System (z.B. Supabase Auth oder NextAuth) ein sinnvoller nächster Schritt.

## Struktur

- `app/` – Next.js App Router Seiten: `/` Schrank (Begrüßung, Wetter, Outfit für heute, Favoriten, Kategorien), `/add` Teil hinzufügen (Foto → animierte KI-Analyse → 1 Bestätigungsseite, oder komplett manuell ohne KI), `/outfits` Kombinieren (Moodboard-Generator mit Teil-Austausch, Speichern, Heute-getragen, Teilen), `/gallery` Community-Feed (vertikal, Likes), `/profil` Profil/Statistiken/Dark-Mode/Profilwechsel/API-Key/PayPal-Support
- `app/api/analyze/route.js` – Server-Route, die Bilder zur KI-Analyse an Anthropic weiterleitet
- `app/api/profiles/route.js` – Profile auflisten/erstellen (Postgres)
- `app/api/outfit-photos/route.js` – Geteilte Outfit-Fotos auflisten/erstellen/löschen (Postgres)
- `app/api/outfit-photos/like/route.js` – Like togglen (Postgres)
- `lib/pgdb.js` – Postgres-Datenlayer (Schema wird automatisch angelegt)
- `lib/db.js` – IndexedDB-Datenlayer (Kleidungsstücke inkl. Trage-Zähler/Favoriten & lokal gespeicherte Outfit-Kombinationen, geräte-lokal)
- `lib/color.js`, `lib/image.js`, `lib/ai.js` – Farb-Matching, Bild-Resizing, KI-Client
- `lib/constants.js` – Kategorien, Farb-Swatches (Picker statt Hex-Eingabe), Fit/Muster/Saison-Optionen
- `lib/outfitEngine.js` – gemeinsame Outfit-Matching-Logik (Slots, Scoring) für Startseite & Kombinieren-Seite
- `lib/weather.js` – Live-Wetter (Open-Meteo, ohne API-Key) mit Kalender-Fallback für die Saison-Empfehlung
- `lib/share.js` – setzt mehrere Kleidungsstück-Fotos zu einem Bild zusammen, um ein Outfit als Foto zu teilen
- `lib/i18n.js`, `lib/theme.js`, `lib/profile.js` – Onboarding-Übersetzungen, Dark-Mode (Standard: hell), Profil-Verwaltung
- `components/` – AppShell, Splash (Typewriter-Logo), Onboarding, BottomNav (Schrank/Kombinieren/+/Community/Profil), Item-Karten/-Detail

Kleidungsstücke, Trage-Zähler, Favoriten und lokal generierte Outfit-Kombinationen bleiben geräte-lokal (IndexedDB). Geteilte Outfit-**Fotos** (die man bewusst hochlädt oder aus dem Moodboard teilt) sowie Profile und Likes liegen in der zentralen Postgres-Datenbank, damit die Community funktioniert.

## Eigene Schriftart (optional)

`app/globals.css` bindet optional die Schriftart "Agraham" per `@font-face` ein (Pfad `public/fonts/Agraham.otf`). Die Datei muss manuell in `public/fonts/` abgelegt werden. **Hinweis zur Lizenz:** Die mitgelieferte Lizenz von Agraham erlaubt laut Hersteller nur die private, nicht-kommerzielle Nutzung ("FREE FOR PERSONAL USE ONLY. NO COMMERCIAL USE ALLOWED!"). Da MyClo unter eigenem Markennamen (SXMU) läuft und einen PayPal-Spendenlink enthält, lohnt sich vor einem echten Launch ein Blick auf die kommerzielle Lizenz des Herstellers.
