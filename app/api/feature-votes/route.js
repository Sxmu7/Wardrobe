export const runtime = 'nodejs';
import { listFeatureIdeas, toggleFeatureVote } from '../../../lib/pgdb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const viewerProfileId = parseInt(searchParams.get('profileId') || '0', 10);
    const ideas = await listFeatureIdeas(viewerProfileId);
    return Response.json({ ideas });
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const featureId = parseInt(body.featureId, 10);
    const profileId = parseInt(body.profileId, 10);
    if (!featureId || !profileId) {
      return Response.json({ error: 'featureId/profileId fehlt' }, { status: 400 });
    }
    const result = await toggleFeatureVote(featureId, profileId);
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
