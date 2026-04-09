import { verifyToken } from '@clerk/backend';
import { getUserByClerkUserId } from '../models/userModel.js';
import { loadClerkUser, syncLocalUserFromClerk } from '../services/clerkUserService.js';

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminUser(email) {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    return true;
  }

  return adminEmails.includes(String(email || '').trim().toLowerCase());
}

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      const error = new Error('Authentication required');
      error.status = 401;
      throw error;
    }

    const origins = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: origins,
      clockSkewInMs: 60000,
    });

    if (!verifiedToken?.sub) {
      const error = new Error('Authentication required');
      error.status = 401;
      throw error;
    }

    let localUser = await getUserByClerkUserId(verifiedToken.sub);

    if (!localUser) {
      const clerkUser = await loadClerkUser(verifiedToken.sub);
      localUser = await syncLocalUserFromClerk(clerkUser);
    }

    req.user = {
      id: localUser.id,
      clerkUserId: localUser.clerk_user_id,
      name: localUser.name,
      email: localUser.email,
      mobile: localUser.mobile,
      dob: localUser.dob,
      gender: localUser.gender,
      profilePic: localUser.profile_pic,
      isAdmin: isAdminUser(localUser.email),
    };

    next();
  } catch (err) {
    err.status = err.status || 401;
    next(err);
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.isAdmin) {
    next();
    return;
  }

  const error = new Error('Admin access required');
  error.status = 403;
  next(error);
}
