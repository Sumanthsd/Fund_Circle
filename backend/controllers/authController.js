import { getActiveUsers } from '../models/userModel.js';

export async function getCurrentUser(req, res) {
  res.json(req.user);
}

export async function getActiveUsersHandler(_req, res, next) {
  try {
    const activeUsers = await getActiveUsers({ withinMinutes: 5, limit: 25 });
    res.json(activeUsers);
  } catch (err) {
    next(err);
  }
}
