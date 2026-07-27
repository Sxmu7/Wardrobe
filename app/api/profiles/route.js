export const runtime = 'nodejs';
import { listProfiles, createProfile, deleteProfile, getProfileById } from '../../../lib/pgdb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!id) return Response.json({ error: 'Ungueltiger Account-Code' }, { status: 400 });
      const profile = await getProfileById(id);
      if (!profile) return Response.json({ error: 'Kein Account mit diesem Code gefunden' }, { status: 404 });
      return Response.json({ profile });
    }
    const profiles = await listProfiles();
    return Response.json({ profiles });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const name = (body.name || '').trim();
    if (!name) return Response.json({ error: 'Name fehlt' }, { status: 400 });
    const profile = await createProfile(name);
    return Response.json({ profile });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    if (!body.id) return Response.json({ error: 'id fehlt' }, { status: 400 });
    await deleteProfile(body.id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
