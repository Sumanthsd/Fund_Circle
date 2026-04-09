import { updateUserProfile } from '../models/userModel.js';

export async function updateProfile(userId, payload) {
  const gender = payload.gender ? String(payload.gender) : null;
  if (gender && !['Male', 'Female', 'Other', 'Prefer not to say'].includes(gender)) {
    const error = new Error('Invalid gender');
    error.status = 400;
    throw error;
  }

  return updateUserProfile(userId, {
    mobile: payload.mobile ? String(payload.mobile) : null,
    dob: payload.dob ? String(payload.dob) : null,
    gender,
  });
}
