export const runtime = 'nodejs';
import { upsertSyncedItem, deleteSyncedItem, listSyncedItems } from '../../../lib/pgdb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = parseInt(searchParams.get('profileId'), 10);
    if (!profileId) return Response.json({ error: 'profileId fehlt' }, { status: 400 });
    const items = await listSyncedItems(profileId);
    return Response.json({ items });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.profileId || !body.item || !body.item.id) return Response.json({ error: 'profileId/item fehlt' }, { status: 400 });
    await upsertSyncedItem(body.profileId, body.item);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    if (!body.id || !body.profileId) return Response.json({ error: 'id/profileId fehlt' }, { status: 400 });
    await deleteSyncedItem(body.id, body.profileId);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
