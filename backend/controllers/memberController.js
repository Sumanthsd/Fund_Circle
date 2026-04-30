import { addMember, editMember, listMembers, removeMember } from '../services/memberService.js';
import { bumpDataRevision } from '../services/realtimeService.js';

export async function getMembersHandler(_req, res, next) {
  try {
    res.json(await listMembers());
  } catch (err) {
    next(err);
  }
}

export async function createMemberHandler(req, res, next) {
  try {
    const result = await addMember(req.body || {});
    bumpDataRevision();
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateMemberHandler(req, res, next) {
  try {
    const result = await editMember(Number(req.params.id), req.body || {}, req.user);
    bumpDataRevision();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteMemberHandler(req, res, next) {
  try {
    const result = await removeMember(Number(req.params.id));
    bumpDataRevision();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
