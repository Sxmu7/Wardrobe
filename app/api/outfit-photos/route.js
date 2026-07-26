export const runtime = 'nodejs';
import { listOutfitPhotos, createOutfitPhoto, deleteOutfitPhoto } from '../../../lib/pgdb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const viewerProfileId = parseInt(searchParams.get('profileId') || '0', 10);
    const photos = await listOutfitPhotos(viewerProfileId);
    return Response.json({ photos });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const profileId = parseInt(body.profileId, 10);
    if (!profileId) return Response.json({ error: 'Kein Profil ausgewaehlt' }, { status: 400 });
    if (!body.image) return Response.json({ error: 'Kein Bild' }, { status: 400 });
    const photo = await createOutfitPhoto(profileId, body.image, body.note);
    return Response.json({ photo });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const id = parseInt(body.id, 10);
    const profileId = parseInt(body.profileId, 10);
    if (!id || !profileId) return Response.json({ error: 'id/profileId fehlt' }, { status: 400 });
    await deleteOutfitPhoto(id, profileId);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
