import { allAsync, execAsync, getAsync, runAsync } from './db.js';

const members = ['Sumanth S', 'Sumanth SD', 'Gururaj', 'Mahesh', 'Rohit', 'Basavaraj'];

async function ensureMember(name) {
  const existing = await getAsync('SELECT * FROM members WHERE name = $1', [name]);
  if (existing) return existing;

  const created = await runAsync(
    `INSERT INTO members (name, is_active, created_at)
     VALUES ($1, 1, $2)`,
    [name, new Date().toISOString()]
  );

  return getAsync('SELECT * FROM members WHERE id = $1', [created.lastID]);
}

async function seedCycle({ name, startMonth, endMonth, contributionAmount, payoutAmount, drawDayOfMonth, status, memberNames, months }) {
  const existing = await getAsync('SELECT id FROM chit_cycles WHERE name = $1', [name]);
  if (existing) return;

  const memberRows = [];
  for (const memberName of memberNames) {
    memberRows.push(await ensureMember(memberName));
  }

  const createdCycle = await runAsync(
    `INSERT INTO chit_cycles
      (name, start_month, end_month, contribution_amount, payout_amount, draw_day_of_month, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [name, startMonth, endMonth, contributionAmount, payoutAmount, drawDayOfMonth, status, new Date().toISOString()]
  );

  const cycle = await getAsync('SELECT * FROM chit_cycles WHERE id = $1', [createdCycle.lastID]);

  for (const member of memberRows) {
    await runAsync(
      `INSERT INTO cycle_members (cycle_id, member_id, payout_received, is_active_in_cycle)
       VALUES ($1, $2, 0, 1)`,
      [cycle.id, member.id]
    );
  }

  for (const monthInput of months) {
    const recipient = monthInput.recipient
      ? memberRows.find((member) => member.name === monthInput.recipient)
      : null;

    const createdMonth = await runAsync(
      `INSERT INTO chit_months
        (cycle_id, month_label, due_date, transfer_date, status, payout_recipient_member_id, selection_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        cycle.id,
        monthInput.label,
        monthInput.dueDate,
        monthInput.transferDate || null,
        monthInput.status,
        recipient?.id || null,
        monthInput.method || null,
        monthInput.notes || null,
      ]
    );

    const month = await getAsync('SELECT * FROM chit_months WHERE id = $1', [createdMonth.lastID]);

    for (const member of memberRows) {
      await runAsync(
        `INSERT INTO monthly_contributions
          (chit_month_id, member_id, amount, status, paid_date, notes)
         VALUES ($1, $2, $3, $4, $5, NULL)`,
        [
          month.id,
          member.id,
          contributionAmount,
          status === 'DRAFT' ? 'PENDING' : 'PAID',
          status === 'DRAFT' ? null : monthInput.transferDate || monthInput.dueDate,
        ]
      );
    }

    if (recipient) {
      await runAsync(
        `UPDATE cycle_members
         SET payout_received = 1, payout_month_id = $1
         WHERE cycle_id = $2 AND member_id = $3`,
        [month.id, cycle.id, recipient.id]
      );
    }
  }
}

export async function initDb() {
  await execAsync(`
    CREATE TABLE IF NOT EXISTS app_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clerk_user_id TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      mobile TEXT,
      dob TEXT,
      gender TEXT,
      profile_pic TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT,
      mobile TEXT,
      dob TEXT,
      gender TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chit_cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      start_month TEXT NOT NULL,
      end_month TEXT NOT NULL,
      contribution_amount INTEGER NOT NULL,
      payout_amount INTEGER NOT NULL,
      draw_day_of_month INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      coordinator_member_id INTEGER REFERENCES members(id),
      document_coordinator_member_id INTEGER REFERENCES members(id),
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS cycle_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cycle_id INTEGER NOT NULL REFERENCES chit_cycles(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      payout_received INTEGER NOT NULL DEFAULT 0,
      payout_month_id INTEGER,
      is_active_in_cycle INTEGER NOT NULL DEFAULT 1,
      UNIQUE (cycle_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS chit_months (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cycle_id INTEGER NOT NULL REFERENCES chit_cycles(id) ON DELETE CASCADE,
      month_label TEXT NOT NULL,
      due_date TEXT NOT NULL,
      transfer_date TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      payout_recipient_member_id INTEGER REFERENCES members(id),
      selection_method TEXT,
      notes TEXT,
      UNIQUE (cycle_id, month_label)
    );

    CREATE TABLE IF NOT EXISTS monthly_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chit_month_id INTEGER NOT NULL REFERENCES chit_months(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      paid_date TEXT,
      notes TEXT,
      UNIQUE (chit_month_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS urgency_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chit_month_id INTEGER NOT NULL REFERENCES chit_months(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      notes TEXT,
      created_at TEXT NOT NULL,
      decided_at TEXT
    );

    CREATE TABLE IF NOT EXISTS draw_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chit_month_id INTEGER NOT NULL UNIQUE REFERENCES chit_months(id) ON DELETE CASCADE,
      eligible_member_ids TEXT NOT NULL,
      selected_member_id INTEGER NOT NULL REFERENCES members(id),
      draw_mode TEXT NOT NULL,
      random_proof TEXT NOT NULL,
      drawn_at TEXT NOT NULL,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_chit_months_cycle_id ON chit_months(cycle_id);
    CREATE INDEX IF NOT EXISTS idx_cycle_members_cycle_id ON cycle_members(cycle_id);
    CREATE INDEX IF NOT EXISTS idx_contributions_month_id ON monthly_contributions(chit_month_id);
  `);

  const memberColumns = await allAsync(`PRAGMA table_info(members)`);
  const memberColumnNames = new Set(memberColumns.map((column) => column.name));
  if (!memberColumnNames.has('email')) {
    await runAsync(`ALTER TABLE members ADD COLUMN email TEXT`);
  }

  await seedCycle({
    name: 'First Cycle',
    startMonth: 'June 2025',
    endMonth: 'October 2025',
    contributionAmount: 10000,
    payoutAmount: 50000,
    drawDayOfMonth: 10,
    status: 'CLOSED',
    memberNames: members.slice(0, 5),
    months: [
      { label: 'June 2025', dueDate: '2025-06-10', transferDate: '2025-06-14', recipient: 'Rohit', method: 'URGENCY', status: 'CLOSED', notes: 'Urgent case, payout given' },
      { label: 'July 2025', dueDate: '2025-07-10', transferDate: '2025-07-10', recipient: 'Mahesh', method: 'URGENCY', status: 'CLOSED', notes: 'Urgent case, payout given' },
      { label: 'August 2025', dueDate: '2025-08-10', transferDate: '2025-08-10', recipient: 'Sumanth SD', method: 'URGENCY', status: 'CLOSED', notes: 'Urgent case, payout given' },
      { label: 'September 2025', dueDate: '2025-09-10', transferDate: '2025-09-10', recipient: 'Sumanth S', method: 'URGENCY', status: 'CLOSED', notes: 'Urgent case, payout given' },
      { label: 'October 2025', dueDate: '2025-10-10', transferDate: '2025-10-10', recipient: 'Gururaj', method: 'LAST_DRAW', status: 'CLOSED', notes: 'Last remaining member, payout given' },
    ],
  });

  await seedCycle({
    name: 'Second Cycle',
    startMonth: 'November 2025',
    endMonth: 'April 2026',
    contributionAmount: 15000,
    payoutAmount: 90000,
    drawDayOfMonth: 5,
    status: 'CLOSED',
    memberNames: members,
    months: [
      { label: 'November 2025', dueDate: '2025-11-05', transferDate: '2025-11-05', recipient: 'Mahesh', method: 'CHITS', status: 'CLOSED', notes: 'Two members asked, draw selected Mahesh' },
      { label: 'December 2025', dueDate: '2025-12-05', transferDate: '2025-12-05', recipient: 'Basavaraj', method: 'URGENCY', status: 'CLOSED', notes: 'Urgent case, payout given' },
      { label: 'January 2026', dueDate: '2026-01-05', transferDate: '2026-01-05', recipient: 'Sumanth S', method: 'URGENCY', status: 'CLOSED', notes: 'Urgent case, payout given' },
      { label: 'February 2026', dueDate: '2026-02-05', transferDate: '2026-02-05', recipient: 'Sumanth SD', method: 'URGENCY', status: 'CLOSED', notes: 'Urgent case, payout given' },
      { label: 'March 2026', dueDate: '2026-03-05', transferDate: '2026-03-05', recipient: 'Rohit', method: 'URGENCY', status: 'CLOSED', notes: 'Urgent case, payout given' },
      { label: 'April 2026', dueDate: '2026-04-05', transferDate: '2026-04-05', recipient: 'Gururaj', method: 'LAST_DRAW', status: 'CLOSED', notes: 'Last remaining member, payout given' },
    ],
  });
}
