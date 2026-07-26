export const runtime = 'nodejs';
import { listProfiles, createProfile } from '../../../lib/pgdb';

export async function GET() {
  try {
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
