// Outfit-Vorschlaege per KI (Text-Reasoning ueber Google Gemini oder Anthropic Claude),
// beruecksichtigt Wetter, Anlass und die komplette Garderobe statt nur Farb-Matching.

export async function suggestOutfitAI({ items, weather, occasion }) {
  const geminiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  const geminiModel = typeof window !== 'undefined' ? localStorage.getItem('gemini_model') : null;
  const anthropicKey = typeof window !== 'undefined' ? localStorage.getItem('anthropic_api_key') : null;
  const anthropicModel = typeof window !== 'undefined' ? localStorage.getItem('anthropic_model') : null;

  if (!geminiKey && !anthropicKey) {
    throw new Error('Kein API-Key hinterlegt. Bitte im Profil einen kostenlosen Gemini-Key eintragen.');
  }

  const compact = items.map((i) => ({
    id: i.id, category: i.category, subtype: i.subtype, colorLabel: i.colorLabel,
    colorFamily: i.colorFamily, pattern: i.pattern, material: i.material, season: i.season,
  }));

  const res = await fetch('/api/outfit-suggest', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ geminiKey, geminiModel, anthropicKey, anthropicModel, items: compact, weather, occasion }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'KI-Outfit-Vorschlag fehlgeschlagen');

  const chosen = json.itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean);
  if (chosen.length === 0) throw new Error('Die KI hat keine passenden Teile aus deiner Garderobe gefunden.');
  return { items: chosen, missing: [], score: null, reasoning: json.reasoning || '' };
}
