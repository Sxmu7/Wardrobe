export const runtime = 'nodejs';

function buildPrompt({ items, weather, occasion }) {
  const list = items.map((i) => ({
    id: i.id,
    kategorie: i.category,
    typ: i.subtype || '',
    farbe: i.colorLabel || '',
    farbfamilie: i.colorFamily || '',
    muster: i.pattern || 'uni',
    material: i.material || '',
    saison: i.season || [],
  }));
  const wetterText = weather
    ? `${weather.tempC}°C, ${weather.label}`
    : 'unbekannt (nimm die aktuelle Kalender-Saison als Anhaltspunkt)';
  return `Du bist ein Mode-Stylist. Hier ist die Garderobe einer Person als JSON-Liste (jedes Objekt hat eine "id"):
${JSON.stringify(list)}

Wetter heute: ${wetterText}
Anlass: ${occasion || 'Alltag'}

Stelle ein stimmiges Outfit aus 2 bis 5 dieser Teile zusammen (nur existierende "id"-Werte verwenden, keine erfinden). Beruecksichtige Farbharmonie, Wetter (z.B. Jacke bei Kaelte, keine Wintersachen im Sommer) und den Anlass. Ein Kleid ersetzt Oberteil+Hose/Rock. Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt ohne Markdown in diesem Format: { "itemIds": ["id1","id2"], "reasoning": "kurze deutsche Begruendung in 1-2 Saetzen" }.`;
}

async function callGemini(prompt, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-3.5-flash'}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || ('Gemini-Fehler (' + res.status + ')');
    throw new Error(msg);
  }
  const parts = data?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts) ? parts.map((p) => p.text || '').join('') : '';
}

async function callAnthropic(prompt, apiKey, model) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || ('Anthropic-Fehler (' + res.status + ')');
    throw new Error(msg);
  }
  return (data && data.content) ? data.content.map((c) => c.text || '').join('') : '';
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { geminiKey, geminiModel, anthropicKey, anthropicModel, items, weather, occasion } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Keine Kleidungsstuecke vorhanden.' }, { status: 400 });
    }
    if (!geminiKey && !anthropicKey) {
      return Response.json({ error: 'Kein API-Key hinterlegt. Bitte in den Einstellungen einen Gemini- oder Anthropic-Key eintragen.' }, { status: 400 });
    }
    const prompt = buildPrompt({ items, weather, occasion });
    let text = '';
    if (geminiKey) {
      text = await callGemini(prompt, geminiKey, geminiModel);
    } else {
      text = await callAnthropic(prompt, anthropicKey, anthropicModel);
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ error: 'Konnte KI-Antwort nicht lesen.' }, { status: 502 });
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.itemIds)) return Response.json({ error: 'KI hat kein gueltiges Outfit geliefert.' }, { status: 502 });
    return Response.json({ itemIds: parsed.itemIds, reasoning: parsed.reasoning || '' });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
