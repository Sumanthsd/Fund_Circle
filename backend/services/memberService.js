import {
  addMemberToCycle,
  createMember,
  createMonthlyContribution,
  deleteDraftMemberLinks,
  deleteMember,
  getCycleMonthsForMemberSeed,
  getDraftCycles,
  getMemberById,
  getMemberCycleLinks,
  getMemberByName,
  getMembers,
  updateMember,
} from '../models/memberModel.js';

export async function listMembers() {
  return getMembers();
}

export async function addMember(payload) {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const mobile = String(payload.mobile || '').trim();
  const dob = String(payload.dob || '').trim();
  const gender = String(payload.gender || '').trim();

  if (!name) {
    const error = new Error('Member name is required');
    error.status = 400;
    throw error;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Member email is invalid');
    error.status = 400;
    throw error;
  }

  const existing = await getMemberByName(name);
  if (existing) {
    const error = new Error('A member with this name already exists');
    error.status = 409;
    throw error;
  }

  const member = await createMember({ name, email, mobile, dob, gender });
  const draftCycles = await getDraftCycles();

  await Promise.all(
    draftCycles.map(async (cycle) => {
      await addMemberToCycle(cycle.id, member.id);
      const months = await getCycleMonthsForMemberSeed(cycle.id);

      await Promise.all(
        months.map((month) =>
          createMonthlyContribution({
            monthId: month.id,
            memberId: member.id,
            amount: cycle.contribution_amount,
            status: 'PENDING',
          })
        )
      );
    })
  );

  return {
    member,
    addedToCycles: draftCycles.map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
    })),
  };
}

export async function editMember(id, payload, actor) {
  const member = await getMemberById(id);
  if (!member) {
    const error = new Error('Member not found');
    error.status = 404;
    throw error;
  }

  const actorEmail = String(actor?.email || '').trim().toLowerCase();
  const isAdmin = Boolean(actor?.isAdmin);

  if (!isAdmin) {
    if (!actorEmail) {
      const error = new Error('Authentication required');
      error.status = 401;
      throw error;
    }

    const memberEmail = String(member.email || '').trim().toLowerCase();
    if (!memberEmail) {
      const error = new Error('Your member profile is missing an email. Ask the admin to add it first.');
      error.status = 403;
      throw error;
    }

    if (memberEmail !== actorEmail) {
      const error = new Error('You can only edit your own member profile.');
      error.status = 403;
      throw error;
    }
  }

  const email = isAdmin ? String(payload.email || '').trim().toLowerCase() : String(member.email || '').trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Member email is invalid');
    error.status = 400;
    throw error;
  }

  return updateMember(id, {
    email,
    mobile: String(payload.mobile || '').trim(),
    dob: String(payload.dob || '').trim(),
    gender: String(payload.gender || '').trim(),
  });
}

export async function removeMember(id) {
  const member = await getMemberById(id);
  if (!member) {
    const error = new Error('Member not found');
    error.status = 404;
    throw error;
  }

  const cycleLinks = await getMemberCycleLinks(id);
  const nonDraftCycles = cycleLinks.filter((cycle) => cycle.status !== 'DRAFT');

  if (nonDraftCycles.length > 0) {
    const error = new Error('This member is already part of active or closed cycles and cannot be deleted');
    error.status = 409;
    throw error;
  }

  await deleteDraftMemberLinks(id);
  await deleteMember(id);

  return { id, deleted: true };
}
