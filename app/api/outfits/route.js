export const runtime = 'nodejs';
import { upsertSyncedOutfit, deleteSyncedOutfit, listSyncedOutfits } from '../../../lib/pgdb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = parseInt(searchParams.get('profileId'), 10);
    if (!profileId) return Response.json({ error: 'profileId fehlt' }, { status: 400 });
    const outfits = await listSyncedOutfits(profileId);
    return Response.json({ outfits });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.profileId || !body.outfit || !body.outfit.id) return Response.json({ error: 'profileId/outfit fehlt' }, { status: 400 });
    await upsertSyncedOutfit(body.profileId, body.outfit);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    if (!body.id || !body.profileId) return Response.json({ error: 'id/profileId fehlt' }, { status: 400 });
    await deleteSyncedOutfit(body.id, body.profileId);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
