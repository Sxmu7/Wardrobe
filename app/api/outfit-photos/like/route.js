export const runtime = 'nodejs';
import { toggleLike } from '../../../../lib/pgdb';

export async function POST(req) {
  try {
    const body = await req.json();
    const outfitPhotoId = parseInt(body.outfitPhotoId, 10);
    const profileId = parseInt(body.profileId, 10);
    if (!outfitPhotoId || !profileId) {
      return Response.json({ error: 'outfitPhotoId/profileId fehlt' }, { status: 400 });
    }
    const result = await toggleLike(outfitPhotoId, profileId);
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
