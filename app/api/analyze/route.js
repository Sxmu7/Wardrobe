export const runtime = 'nodejs';

const PROMPT = 'Du bist ein Assistent, der Kleidungsstuecke auf Fotos analysiert. Analysiere das Bild und antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt (keine Erklaerung, kein Markdown), in exakt diesem Format: { "category": "oberteil|hose|rock|kleid|jacke|schuhe|accessoire|tasche|sonstiges", "subtype": "kurzes deutsches Wort, z.B. Pullover, T-Shirt, Jeans, Sneaker", "colorHex": "#rrggbb (Hauptfarbe)", "colorNameDe": "deutscher Farbname, z.B. Grau", "pattern": "uni|gestreift|kariert|geblumt|bedruckt|sonstiges", "season": ["fruehling","sommer","herbst","winter passende auswaehlen"], "material": "Vermutung zum Material oder null", "fitGuess": "Slim|Regular|Oversized|Tailliert|Weit oder null falls nicht erkennbar", "confidence": { "category": 0, "colorHex": 0, "pattern": 0, "season": 0, "material": 0, "fitGuess": 0 } }. Werte in confidence sind Zahlen zwischen 0 und 1. Gib niemals eine Groesse an, da Groesse von einem Foto nicht ableitbar ist. Antworte nur mit dem JSON-Objekt, sonst nichts.';

export async function POST(req) {
  try {
    const body = await req.json();
    const apiKey = body.apiKey;
    const model = body.model;
    const imageBase64 = body.imageBase64;
    const mediaType = body.mediaType;
    if (!apiKey) {
      return Response.json({ error: 'Kein API-Key hinterlegt. Bitte in den Einstellungen eintragen.' }, { status: 400 });
    }
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });
    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      const msg = (data && data.error && data.error.message) || ('Anthropic-Fehler (' + anthropicRes.status + ')');
      return Response.json({ error: msg }, { status: anthropicRes.status });
    }
    let text = '';
    if (data && data.content) {
      text = data.content.map((c) => c.text || '').join('');
    }
    return Response.json({ text: text });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
