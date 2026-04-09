import { allAsync, getAsync, runAsync } from '../config/db.js';

export async function getMembers() {
  return allAsync(
    `SELECT *
     FROM members
     ORDER BY name ASC`
  );
}

export async function getMemberById(id) {
  return getAsync('SELECT * FROM members WHERE id = $1', [id]);
}

export async function getMemberCycleLinks(id) {
  return allAsync(
    `SELECT cc.id, cc.name, cc.status
     FROM cycle_members cm
     JOIN chit_cycles cc ON cc.id = cm.cycle_id
     WHERE cm.member_id = $1
     ORDER BY cc.id ASC`,
    [id]
  );
}

export async function getMemberByName(name) {
  return getAsync('SELECT * FROM members WHERE lower(name) = lower($1)', [name]);
}

export async function createMember({ name, email, mobile, dob, gender }) {
  const createdAt = new Date().toISOString();
  const result = await runAsync(
    `INSERT INTO members (name, email, mobile, dob, gender, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, 1, $6)`,
    [name, email || null, mobile || null, dob || null, gender || null, createdAt]
  );

  return getAsync('SELECT * FROM members WHERE id = $1', [result.lastID]);
}

export async function updateMember(id, { email, mobile, dob, gender }) {
  await runAsync(
    `UPDATE members
     SET email = $1, mobile = $2, dob = $3, gender = $4
     WHERE id = $5`,
    [email || null, mobile || null, dob || null, gender || null, id]
  );

  return getMemberById(id);
}

export async function deleteDraftMemberLinks(memberId) {
  await runAsync(
    `DELETE FROM monthly_contributions
     WHERE member_id = $1
       AND chit_month_id IN (
         SELECT cm.id
         FROM chit_months cm
         JOIN chit_cycles cc ON cc.id = cm.cycle_id
         WHERE cc.status = 'DRAFT'
       )`,
    [memberId]
  );

  await runAsync(
    `DELETE FROM cycle_members
     WHERE member_id = $1
       AND cycle_id IN (
         SELECT id
         FROM chit_cycles
         WHERE status = 'DRAFT'
       )`,
    [memberId]
  );
}

export async function deleteMember(id) {
  await runAsync('DELETE FROM members WHERE id = $1', [id]);
}

export async function getDraftCycles() {
  return allAsync(
    `SELECT *
     FROM chit_cycles
     WHERE status = 'DRAFT'
     ORDER BY id ASC`
  );
}

export async function addMemberToCycle(cycleId, memberId) {
  await runAsync(
    `INSERT OR IGNORE INTO cycle_members (cycle_id, member_id, payout_received, is_active_in_cycle)
     VALUES ($1, $2, 0, 1)`,
    [cycleId, memberId]
  );
}

export async function createMonthlyContribution({ monthId, memberId, amount, status }) {
  await runAsync(
    `INSERT OR IGNORE INTO monthly_contributions
      (chit_month_id, member_id, amount, status, paid_date, notes)
     VALUES ($1, $2, $3, $4, NULL, NULL)`,
    [monthId, memberId, amount, status]
  );
}

export async function getCycleMonthsForMemberSeed(cycleId) {
  return allAsync(
    `SELECT *
     FROM chit_months
     WHERE cycle_id = $1
     ORDER BY due_date ASC`,
    [cycleId]
  );
}
