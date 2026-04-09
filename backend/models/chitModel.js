import { allAsync, getAsync, runAsync } from '../config/db.js';

export async function getCycles() {
  return allAsync('SELECT * FROM chit_cycles ORDER BY id ASC');
}

export async function getContributionById(id) {
  return getAsync('SELECT * FROM monthly_contributions WHERE id = $1', [id]);
}

export async function getContributionContext(id) {
  return getAsync(
    `SELECT
      mc.id AS contribution_id,
      mc.status AS contribution_status,
      mc.amount AS contribution_amount,
      mc.paid_date AS contribution_paid_date,
      mc.chit_month_id AS month_id,
      cm.month_label AS month_label,
      cm.due_date AS month_due_date,
      cm.cycle_id AS cycle_id,
      cc.name AS cycle_name,
      m.id AS member_id,
      m.name AS member_name,
      m.email AS member_email,
      m.mobile AS member_mobile
     FROM monthly_contributions mc
     JOIN chit_months cm ON cm.id = mc.chit_month_id
     JOIN chit_cycles cc ON cc.id = cm.cycle_id
     JOIN members m ON m.id = mc.member_id
     WHERE mc.id = $1`,
    [id]
  );
}

export async function getCycleById(id) {
  return getAsync('SELECT * FROM chit_cycles WHERE id = $1', [id]);
}

export async function getCycleByName(name) {
  return getAsync('SELECT * FROM chit_cycles WHERE lower(name) = lower($1)', [name]);
}

export async function createCycle({
  name,
  startMonth,
  endMonth,
  contributionAmount,
  payoutAmount,
  drawDayOfMonth,
  status,
}) {
  const createdAt = new Date().toISOString();
  const result = await runAsync(
    `INSERT INTO chit_cycles
      (name, start_month, end_month, contribution_amount, payout_amount, draw_day_of_month, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
    [name, startMonth, endMonth, contributionAmount, payoutAmount, drawDayOfMonth, status, createdAt]
  );

  return getAsync('SELECT * FROM chit_cycles WHERE id = $1', [result.lastID]);
}

export async function createCycleMonth({
  cycleId,
  monthLabel,
  dueDate,
  status,
  notes,
}) {
  const result = await runAsync(
    `INSERT INTO chit_months
      (cycle_id, month_label, due_date, transfer_date, status, payout_recipient_member_id, selection_method, notes)
     VALUES ($1, $2, $3, NULL, $4, NULL, NULL, $5)`,
    [cycleId, monthLabel, dueDate, status, notes || null]
  );

  return getAsync('SELECT * FROM chit_months WHERE id = $1', [result.lastID]);
}

export async function getCycleMembers(cycleId) {
  return allAsync(
    `SELECT cm.*, m.name, m.mobile, m.gender, m.dob
     FROM cycle_members cm
     JOIN members m ON m.id = cm.member_id
     WHERE cm.cycle_id = $1
     ORDER BY m.name ASC`,
    [cycleId]
  );
}

export async function getCycleMonths(cycleId) {
  return allAsync(
    `SELECT cm.*, m.name AS payout_recipient_name
     FROM chit_months cm
     LEFT JOIN members m ON m.id = cm.payout_recipient_member_id
     WHERE cm.cycle_id = $1
     ORDER BY cm.due_date ASC`,
    [cycleId]
  );
}

export async function getMonthContributions(monthId) {
  return allAsync(
    `SELECT mc.*, m.name AS member_name
     FROM monthly_contributions mc
     JOIN members m ON m.id = mc.member_id
     WHERE mc.chit_month_id = $1
     ORDER BY m.name ASC`,
    [monthId]
  );
}

export async function getMonthById(monthId) {
  return getAsync('SELECT * FROM chit_months WHERE id = $1', [monthId]);
}

export async function getEligibleMembersForMonth(monthId) {
  return allAsync(
    `SELECT m.*
     FROM chit_months target_month
     JOIN cycle_members cm ON cm.cycle_id = target_month.cycle_id
     JOIN members m ON m.id = cm.member_id
     WHERE target_month.id = $1
       AND cm.is_active_in_cycle = TRUE
       AND cm.payout_received = FALSE
     ORDER BY m.name ASC`,
    [monthId]
  );
}

export async function updateContribution(id, status) {
  await runAsync(
    `UPDATE monthly_contributions
     SET status = $1, paid_date = $2
     WHERE id = $3`,
    [status, status === 'PAID' ? new Date().toISOString() : null, id]
  );

  return getAsync('SELECT * FROM monthly_contributions WHERE id = $1', [id]);
}

export async function updateCycleStatus(id, status) {
  const updatedAt = new Date().toISOString();
  await runAsync(`UPDATE chit_cycles SET status = $1, updated_at = $2 WHERE id = $3`, [status, updatedAt, id]);
  return getAsync('SELECT * FROM chit_cycles WHERE id = $1', [id]);
}

export async function updateCycleMonthStatuses(cycleId, fromStatus, toStatus) {
  await runAsync(
    `UPDATE chit_months
     SET status = $1
     WHERE cycle_id = $2 AND status = $3`,
    [toStatus, cycleId, fromStatus]
  );
}

export async function deleteCycle(id) {
  await runAsync('DELETE FROM chit_cycles WHERE id = $1', [id]);
}

export async function getCycleDeleteSafety(id) {
  return getAsync(
    `SELECT
      (SELECT COUNT(*) FROM monthly_contributions mc
       JOIN chit_months m ON m.id = mc.chit_month_id
       WHERE m.cycle_id = $1 AND mc.status = 'PAID') AS paid_count,
      (SELECT COUNT(*) FROM chit_months m
       WHERE m.cycle_id = $1 AND m.payout_recipient_member_id IS NOT NULL) AS payout_count`,
    [id]
  );
}

export async function saveRandomDraw({ monthId, eligibleMemberIds, selectedMemberId, randomProof }) {
  const month = await getMonthById(monthId);
  if (!month) {
    const error = new Error('Chit month not found');
    error.status = 404;
    throw error;
  }

  await runAsync(
    `INSERT INTO draw_results
      (chit_month_id, eligible_member_ids, selected_member_id, draw_mode, random_proof, drawn_at, notes)
     VALUES ($1, $2, $3, 'ALL_ELIGIBLE', $4, $5, $6)
     ON CONFLICT (chit_month_id)
     DO UPDATE SET
      eligible_member_ids = EXCLUDED.eligible_member_ids,
      selected_member_id = EXCLUDED.selected_member_id,
      random_proof = EXCLUDED.random_proof,
      drawn_at = EXCLUDED.drawn_at,
      notes = EXCLUDED.notes`,
    [
      monthId,
      JSON.stringify(eligibleMemberIds),
      selectedMemberId,
      randomProof,
      new Date().toISOString(),
      'Random draw finalized from eligible members.',
    ]
  );

  await runAsync(
    `UPDATE chit_months
     SET payout_recipient_member_id = $1, selection_method = 'RANDOM_DRAW', status = 'PAYOUT_FINALIZED'
     WHERE id = $2`,
    [selectedMemberId, monthId]
  );

  await runAsync(
    `UPDATE cycle_members
     SET payout_received = TRUE, payout_month_id = $1
     WHERE cycle_id = $2 AND member_id = $3`,
    [monthId, month.cycle_id, selectedMemberId]
  );
}
