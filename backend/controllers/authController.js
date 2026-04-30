import { clerkClient } from '@clerk/express';
import { getActiveUsers as getActiveUsersFromDb, getAppUsersForPresence } from '../models/userModel.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getPrimaryEmail(clerkUser) {
  const primary =
    clerkUser.emailAddresses?.find((entry) => entry.id === clerkUser.primaryEmailAddressId) ||
    clerkUser.emailAddresses?.[0];

  return normalizeEmail(primary?.emailAddress);
}

function getDisplayName(clerkUser) {
  const fullName = String(clerkUser.fullName || '').trim();
  if (fullName) return fullName;

  const joined = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim();
  if (joined) return joined;

  const username = String(clerkUser.username || '').trim();
  if (username) return username;

  const email = getPrimaryEmail(clerkUser);
  if (email) return email.split('@')[0];

  return 'User';
}

function normalizeEpochMs(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  // Clerk timestamps may be seconds or milliseconds depending on API surface.
  return numeric < 1e12 ? numeric * 1000 : numeric;
}

export async function getCurrentUser(req, res) {
  res.json(req.user);
}

export async function getActiveUsersHandler(_req, res, next) {
  try {
    const appUsers = await getAppUsersForPresence(200);
    const clerkChecks = await Promise.allSettled(
      appUsers.map(async (appUser) => {
        const clerkUserId = String(appUser.clerk_user_id || '').trim();
        if (!clerkUserId) return null;

        const sessionsResponse = await clerkClient.sessions.getSessionList({
          userId: clerkUserId,
          status: 'active',
          limit: 20,
        });

        const sessions = Array.isArray(sessionsResponse?.data) ? sessionsResponse.data : [];
        if (!sessions.length) return null;

        const latestSessionMs = sessions.reduce((max, session) => {
          const seenMs = normalizeEpochMs(session.lastActiveAt);
          return seenMs > max ? seenMs : max;
        }, 0);

        let profileName = String(appUser.name || '').trim();
        let profileEmail = normalizeEmail(appUser.email);

        try {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          profileName = getDisplayName(clerkUser) || profileName;
          profileEmail = getPrimaryEmail(clerkUser) || profileEmail;
        } catch (_err) {
          // Fall back to local app user profile if Clerk user fetch fails.
        }

        return {
          id: clerkUserId,
          name: profileName || (profileEmail ? profileEmail.split('@')[0] : 'User'),
          email: profileEmail || null,
          last_seen_at: latestSessionMs ? new Date(latestSessionMs).toISOString() : null,
        };
      })
    );

    const activeUsersFromClerk = clerkChecks
      .filter((result) => result.status === 'fulfilled' && result.value)
      .map((result) => result.value);

    const activeUsersFromDb = await getActiveUsersFromDb({ withinMinutes: 5, limit: 50 });
    const mergedByIdentity = new Map();

    for (const entry of [...activeUsersFromDb, ...activeUsersFromClerk]) {
      const key = normalizeEmail(entry.email) || String(entry.id || '').trim().toLowerCase();
      if (!key) continue;
      mergedByIdentity.set(key, entry);
    }

    const activeUsers = Array.from(mergedByIdentity.values())
      .filter((entry) => entry.email || entry.name)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

    res.json(activeUsers);
  } catch (err) {
    try {
      const fallback = await getActiveUsersFromDb({ withinMinutes: 5, limit: 25 });
      res.json(fallback);
      return;
    } catch (_fallbackError) {
      next(err);
    }
  }
}
