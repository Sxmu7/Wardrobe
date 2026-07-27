export const runtime = 'nodejs';

const PROMPT = 'Du bist ein Assistent, der Kleidungsstuecke auf Fotos analysiert. Analysiere das Bild und antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt (keine Erklaerung, kein Markdown, keine Code-Fences), in exakt diesem Format: { "category": "oberteil|hose|rock|kleid|jacke|schuhe|accessoire|tasche|sonstiges", "subtype": "kurzes deutsches Wort, z.B. Pullover, T-Shirt, Jeans, Sneaker", "colorHex": "#rrggbb (Hauptfarbe)", "colorNameDe": "deutscher Farbname, z.B. Grau", "pattern": "uni|gestreift|kariert|geblumt|bedruckt|sonstiges", "season": ["fruehling","sommer","herbst","winter passende auswaehlen"], "material": "Vermutung zum Material oder null", "fitGuess": "Slim|Regular|Oversized|Tailliert|Weit oder null falls nicht erkennbar", "confidence": { "category": 0, "colorHex": 0, "pattern": 0, "season": 0, "material": 0, "fitGuess": 0 } }. Werte in confidence sind Zahlen zwischen 0 und 1. Gib niemals eine Groesse an, da Groesse von einem Foto nicht ableitbar ist. Antworte nur mit dem JSON-Objekt, sonst nichts.';

export async function POST(req) {
  try {
    const body = await req.json();
    const apiKey = body.apiKey;
    const model = body.model || 'gemini-3.5-flash';
    const imageBase64 = body.imageBase64;
    const mediaType = body.mediaType || 'image/jpeg';
    if (!apiKey) {
      return Response.json({ error: 'Kein Google-API-Key hinterlegt. Bitte in den Einstellungen eintragen.' }, { status: 400 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { inline_data: { mime_type: mediaType, data: imageBase64 } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    });
    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      const msg = (data && data.error && data.error.message) || ('Gemini-Fehler (' + geminiRes.status + ')');
      return Response.json({ error: msg }, { status: geminiRes.status });
    }
    let text = '';
    const parts = data?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      text = parts.map((p) => p.text || '').join('');
    }
    if (!text) {
      return Response.json({ error: 'Gemini hat keine Antwort geliefert.' }, { status: 502 });
    }
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
