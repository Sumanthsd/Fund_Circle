import { updateProfile } from '../services/profileService.js';
import { bumpDataRevision } from '../services/realtimeService.js';

export async function getProfileHandler(req, res) {
  res.json(req.user);
}

export async function updateProfileHandler(req, res, next) {
  try {
    const updated = await updateProfile(req.user.id, req.body);
    bumpDataRevision();
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
