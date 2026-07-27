export async function analyzeItemImage(dataUrl, apiKey, model) {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) throw new Error('Ungueltiges Bildformat');
  const meta = match[1];
  const base64 = match[2];
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ apiKey, model, imageBase64: base64, mediaType: meta || 'image/jpeg' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'KI-Analyse fehlgeschlagen');
  const jsonMatch = json.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Konnte KI-Antwort nicht lesen');
  return JSON.parse(jsonMatch[0]);
}

export async function analyzeItemImageGemini(dataUrl, apiKey, model) {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) throw new Error('Ungueltiges Bildformat');
  const meta = match[1];
  const base64 = match[2];
  const res = await fetch('/api/analyze-gemini', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ apiKey, model, imageBase64: base64, mediaType: meta || 'image/jpeg' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Gemini-Analyse fehlgeschlagen');
  const jsonMatch = json.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Konnte Gemini-Antwort nicht lesen');
  return JSON.parse(jsonMatch[0]);
}
