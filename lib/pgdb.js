import { sql } from '@vercel/postgres';

let ready = null;

const AVATAR_COLORS = ['#c96f4a', '#4c7a9e', '#7a9e4c', '#9e4c7a', '#c9a13a', '#4ca19e'];
const AVATAR_EMOJIS = ['🙂', '🦊', '🐼', '🌵', '🌟', '🍄', '🐝', '🦋'];

export function pickAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
export function pickAvatarEmoji() {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
}

export async function ensureSchema() {
  if (ready) return ready;
  ready = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        avatar_color TEXT NOT NULL DEFAULT '#c96f4a',
        avatar_emoji TEXT NOT NULL DEFAULT '🙂',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS outfit_photos (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        image TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS outfit_likes (
        id SERIAL PRIMARY KEY,
        outfit_photo_id INTEGER NOT NULL REFERENCES outfit_photos(id) ON DELETE CASCADE,
        profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(outfit_photo_id, profile_id)
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS synced_items (
        id TEXT PRIMARY KEY,
        profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS synced_outfits (
        id TEXT PRIMARY KEY,
        profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
  })();
  return ready;
}

export async function listProfiles() {
  await ensureSchema();
  const { rows } = await sql`SELECT id, name, avatar_color, avatar_emoji, created_at FROM profiles ORDER BY created_at ASC;`;
  return rows;
}

export async function createProfile(name) {
  await ensureSchema();
  const color = pickAvatarColor();
  const emoji = pickAvatarEmoji();
  const { rows } = await sql`
    INSERT INTO profiles (name, avatar_color, avatar_emoji)
    VALUES (${name}, ${color}, ${emoji})
    RETURNING id, name, avatar_color, avatar_emoji, created_at;
  `;
  return rows[0];
}

export async function deleteProfile(id) {
  await ensureSchema();
  await sql`DELETE FROM profiles WHERE id = ${id};`;
}

export async function getProfileById(id) {
  await ensureSchema();
  const { rows } = await sql`SELECT id, name, avatar_color, avatar_emoji, created_at FROM profiles WHERE id = ${id};`;
  return rows[0] || null;
}

export async function upsertSyncedItem(profileId, item) {
  await ensureSchema();
  await sql`
    INSERT INTO synced_items (id, profile_id, data, updated_at)
    VALUES (${item.id}, ${profileId}, ${JSON.stringify(item)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(item)}::jsonb, profile_id = ${profileId}, updated_at = now();
  `;
}

export async function deleteSyncedItem(id, profileId) {
  await ensureSchema();
  await sql`DELETE FROM synced_items WHERE id = ${id} AND profile_id = ${profileId};`;
}

export async function listSyncedItems(profileId) {
  await ensureSchema();
  const { rows } = await sql`SELECT data FROM synced_items WHERE profile_id = ${profileId} ORDER BY updated_at ASC;`;
  return rows.map((r) => r.data);
}

export async function upsertSyncedOutfit(profileId, outfit) {
  await ensureSchema();
  await sql`
    INSERT INTO synced_outfits (id, profile_id, data, updated_at)
    VALUES (${outfit.id}, ${profileId}, ${JSON.stringify(outfit)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(outfit)}::jsonb, profile_id = ${profileId}, updated_at = now();
  `;
}

export async function deleteSyncedOutfit(id, profileId) {
  await ensureSchema();
  await sql`DELETE FROM synced_outfits WHERE id = ${id} AND profile_id = ${profileId};`;
}

export async function listSyncedOutfits(profileId) {
  await ensureSchema();
  const { rows } = await sql`SELECT data FROM synced_outfits WHERE profile_id = ${profileId} ORDER BY updated_at ASC;`;
  return rows.map((r) => r.data);
}

export async function listOutfitPhotos(viewerProfileId) {
  await ensureSchema();
  const { rows } = await sql`
    SELECT
      op.id,
      op.image,
      op.note,
      op.created_at,
      p.id AS profile_id,
      p.name AS profile_name,
      p.avatar_color,
      p.avatar_emoji,
      COALESCE(lc.like_count, 0)::int AS like_count,
      EXISTS (
        SELECT 1 FROM outfit_likes ol
        WHERE ol.outfit_photo_id = op.id AND ol.profile_id = ${viewerProfileId || 0}
      ) AS liked_by_me
    FROM outfit_photos op
    JOIN profiles p ON p.id = op.profile_id
    LEFT JOIN (
      SELECT outfit_photo_id, COUNT(*) AS like_count
      FROM outfit_likes
      GROUP BY outfit_photo_id
    ) lc ON lc.outfit_photo_id = op.id
    ORDER BY op.created_at DESC;
  `;
  return rows;
}

export async function createOutfitPhoto(profileId, image, note) {
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO outfit_photos (profile_id, image, note)
    VALUES (${profileId}, ${image}, ${note || null})
    RETURNING id, profile_id, image, note, created_at;
  `;
  return rows[0];
}

export async function deleteOutfitPhoto(id, profileId) {
  await ensureSchema();
  await sql`DELETE FROM outfit_photos WHERE id = ${id} AND profile_id = ${profileId};`;
}

export async function toggleLike(outfitPhotoId, profileId) {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id FROM outfit_likes WHERE outfit_photo_id = ${outfitPhotoId} AND profile_id = ${profileId};
  `;
  if (rows.length) {
    await sql`DELETE FROM outfit_likes WHERE outfit_photo_id = ${outfitPhotoId} AND profile_id = ${profileId};`;
    return { liked: false };
  }
  await sql`INSERT INTO outfit_likes (outfit_photo_id, profile_id) VALUES (${outfitPhotoId}, ${profileId});`;
  return { liked: true };
}
