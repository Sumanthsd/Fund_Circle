import { addMember, editMember, listMembers, removeMember } from '../services/memberService.js';

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
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateMemberHandler(req, res, next) {
  try {
    const result = await editMember(Number(req.params.id), req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteMemberHandler(req, res, next) {
  try {
    res.json(await removeMember(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
}
