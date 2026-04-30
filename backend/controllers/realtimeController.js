import { getDataRevision } from '../services/realtimeService.js';

export async function getDataRevisionHandler(_req, res) {
  res.json({ revision: getDataRevision() });
}

