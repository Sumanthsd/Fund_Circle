import { clerkClient } from '@clerk/express';
import { createUser, getUserByClerkUserId, syncClerkIdentity } from '../models/userModel.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getPrimaryEmail(clerkUser) {
  const primary =
    clerkUser.emailAddresses?.find((entry) => entry.id === clerkUser.primaryEmailAddressId) ||
    clerkUser.emailAddresses?.[0];

  return normalizeEmail(primary?.emailAddress);
}

function buildDisplayName(clerkUser) {
  const fullName = String(clerkUser.fullName || '').trim();
  if (fullName) return fullName;

  const joined = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim();
  if (joined) return joined;

  const email = getPrimaryEmail(clerkUser);
  return email ? email.split('@')[0] : 'Chit Member';
}

export async function loadClerkUser(clerkUserId) {
  return clerkClient.users.getUser(clerkUserId);
}

export async function syncLocalUserFromClerk(clerkUser) {
  const clerkUserId = String(clerkUser.id || '').trim();
  const email = getPrimaryEmail(clerkUser);
  const name = buildDisplayName(clerkUser);
  const profilePic = String(clerkUser.imageUrl || '').trim() || null;

  if (!clerkUserId || !email) {
    const error = new Error('Clerk user is missing a primary email address');
    error.status = 400;
    throw error;
  }

  const existing = await getUserByClerkUserId(clerkUserId);
  if (existing) {
    return syncClerkIdentity(existing.id, { name, email, profilePic });
  }

  return createUser({
    clerkUserId,
    name,
    email,
    profilePic,
    createdAt: new Date().toISOString(),
  });
}
