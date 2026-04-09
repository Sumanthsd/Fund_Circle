import { updateProfile } from '../services/profileService.js';

export async function getProfileHandler(req, res) {
  res.json(req.user);
}

export async function updateProfileHandler(req, res, next) {
  try {
    const updated = await updateProfile(req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
