import { allAsync, getAsync, runAsync } from '../config/db.js';

export async function getUserByClerkUserId(clerkUserId) {
  return getAsync('SELECT * FROM app_users WHERE clerk_user_id = $1', [clerkUserId]);
}

export async function createUser({ clerkUserId, name, email, profilePic, createdAt }) {
  const insert = await runAsync(
    `INSERT INTO app_users (clerk_user_id, name, email, profile_pic, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $5)`,
    [clerkUserId, name, email, profilePic, createdAt]
  );

  return getAsync('SELECT * FROM app_users WHERE id = $1', [insert.lastID]);
}

export async function syncClerkIdentity(id, { name, email, profilePic }) {
  const updatedAt = new Date().toISOString();
  await runAsync(
    `UPDATE app_users
     SET name = $1, email = $2, profile_pic = $3, updated_at = $4
     WHERE id = $5`,
    [name, email, profilePic, updatedAt, id]
  );

  return getAsync('SELECT * FROM app_users WHERE id = $1', [id]);
}

export async function updateUserProfile(id, { mobile, dob, gender }) {
  const updatedAt = new Date().toISOString();
  await runAsync(
    `UPDATE app_users
     SET mobile = $1, dob = $2, gender = $3, updated_at = $4
     WHERE id = $5`,
    [mobile || null, dob || null, gender || null, updatedAt, id]
  );

  return getAsync('SELECT * FROM app_users WHERE id = $1', [id]);
}

export async function touchUserPresence(id) {
  const lastSeenAt = new Date().toISOString();
  await runAsync(
    `UPDATE app_users
     SET last_seen_at = $1, updated_at = $1
     WHERE id = $2`,
    [lastSeenAt, id]
  );
}

export async function getActiveUsers({ withinMinutes = 5, limit = 25 } = {}) {
  const safeWithinMinutes = Number.isFinite(withinMinutes) ? Math.max(1, Math.min(60, Math.round(withinMinutes))) : 5;
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.round(limit))) : 25;
  const cutoff = new Date(Date.now() - safeWithinMinutes * 60 * 1000).toISOString();

  return allAsync(
    `SELECT id, name, email, last_seen_at
     FROM app_users
     WHERE last_seen_at IS NOT NULL
       AND last_seen_at >= $1
     ORDER BY COALESCE(NULLIF(name, ''), email) COLLATE NOCASE ASC
     LIMIT $2`,
    [cutoff, safeLimit]
  );
}
