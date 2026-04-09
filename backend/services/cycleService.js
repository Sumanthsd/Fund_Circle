import {
  createCycle,
  createCycleMonth,
  deleteCycle,
  getCycleById,
  getCycleMembers,
  getCycleByName,
  getCycleMonths,
  getCycles,
  getEligibleMembersForMonth,
  getMonthContributions,
  saveRandomDraw,
  updateContribution,
} from '../models/chitModel.js';
import { execAsync } from '../config/db.js';
import { addMemberToCycle, createMonthlyContribution, getMemberById } from '../models/memberModel.js';

function parseStartMonth(value) {
  const [yearText, monthText] = String(value || '').split('-');
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, 1));
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatIsoDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildMonthSchedule(startMonthDate, monthsCount, drawDay) {
  return Array.from({ length: monthsCount }, (_, index) => {
    const monthBase = new Date(
      Date.UTC(startMonthDate.getUTCFullYear(), startMonthDate.getUTCMonth() + index, 1)
    );
    const lastDay = new Date(
      Date.UTC(monthBase.getUTCFullYear(), monthBase.getUTCMonth() + 1, 0)
    ).getUTCDate();
    const safeDrawDay = Math.max(1, Math.min(drawDay, lastDay));
    const dueDate = new Date(
      Date.UTC(monthBase.getUTCFullYear(), monthBase.getUTCMonth(), safeDrawDay)
    );

    return {
      monthLabel: formatMonthLabel(monthBase),
      dueDate: formatIsoDate(dueDate),
    };
  });
}

export async function listCycles() {
  const cycles = await getCycles();

  return Promise.all(
    cycles.map(async (cycle) => {
      const [members, months] = await Promise.all([
        getCycleMembers(cycle.id),
        getCycleMonths(cycle.id),
      ]);

      const monthsWithContributions = await Promise.all(
        months.map(async (month) => ({
          ...month,
          contributions: await getMonthContributions(month.id),
        }))
      );

      return {
        ...cycle,
        members,
        months: monthsWithContributions,
      };
    })
  );
}

export async function createNewCycle(payload) {
  const name = String(payload.name || '').trim();
  const startMonthInput = String(payload.startMonth || '').trim();
  const monthsCount = Number(payload.monthsCount);
  const contributionAmount = Number(payload.contributionAmount);
  const drawDayOfMonth = Number(payload.drawDayOfMonth);
  const memberIds = Array.from(
    new Set(
      Array.isArray(payload.memberIds)
        ? payload.memberIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
        : []
    )
  );

  if (!name) {
    const error = new Error('Cycle name is required');
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(monthsCount) || monthsCount < 1 || monthsCount > 24) {
    const error = new Error('Months count must be between 1 and 24');
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(contributionAmount) || contributionAmount <= 0) {
    const error = new Error('Monthly contribution must be a positive integer');
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(drawDayOfMonth) || drawDayOfMonth < 1 || drawDayOfMonth > 31) {
    const error = new Error('Draw day must be between 1 and 31');
    error.status = 400;
    throw error;
  }

  if (memberIds.length < 2) {
    const error = new Error('At least two members are required to create a cycle');
    error.status = 400;
    throw error;
  }

  const startMonthDate = parseStartMonth(startMonthInput);
  if (!startMonthDate) {
    const error = new Error('Start month is invalid');
    error.status = 400;
    throw error;
  }

  const existing = await getCycleByName(name);
  if (existing) {
    const error = new Error('A cycle with this name already exists');
    error.status = 409;
    throw error;
  }

  const members = await Promise.all(memberIds.map((memberId) => getMemberById(memberId)));
  if (members.some((member) => !member)) {
    const error = new Error('One or more selected members do not exist');
    error.status = 400;
    throw error;
  }

  const schedule = buildMonthSchedule(startMonthDate, monthsCount, drawDayOfMonth);
  const endMonth = schedule[schedule.length - 1]?.monthLabel || formatMonthLabel(startMonthDate);
  const payoutAmount = contributionAmount * memberIds.length;

  await execAsync('BEGIN');
  let cycle;

  try {
    cycle = await createCycle({
      name,
      startMonth: schedule[0].monthLabel,
      endMonth,
      contributionAmount,
      payoutAmount,
      drawDayOfMonth,
      status: 'DRAFT',
    });

    for (const memberId of memberIds) {
      await addMemberToCycle(cycle.id, memberId);
    }

    for (const month of schedule) {
      const createdMonth = await createCycleMonth({
        cycleId: cycle.id,
        monthLabel: month.monthLabel,
        dueDate: month.dueDate,
        status: 'DRAFT',
        notes: 'Created by admin user',
      });

      for (const memberId of memberIds) {
        await createMonthlyContribution({
          monthId: createdMonth.id,
          memberId,
          amount: contributionAmount,
          status: 'PENDING',
        });
      }
    }

    await execAsync('COMMIT');
  } catch (err) {
    await execAsync('ROLLBACK');
    throw err;
  }

  return cycle;
}

export async function removeCycle(id) {
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error('Invalid cycle id');
    error.status = 400;
    throw error;
  }

  const cycle = await getCycleById(id);
  if (!cycle) {
    const error = new Error('Cycle not found');
    error.status = 404;
    throw error;
  }

  if (cycle.status !== 'DRAFT') {
    const error = new Error('Only DRAFT cycles can be deleted');
    error.status = 409;
    throw error;
  }

  await deleteCycle(id);
  return { id, deleted: true };
}

export async function markContributionPaid(id, status) {
  if (!['PENDING', 'PAID', 'DELAYED'].includes(status)) {
    const error = new Error('Invalid contribution status');
    error.status = 400;
    throw error;
  }

  return updateContribution(id, status);
}

export async function finalizeRandomDraw(monthId, selectedMemberId) {
  const eligibleMembers = await getEligibleMembersForMonth(monthId);
  if (eligibleMembers.length === 0) {
    const error = new Error('No eligible members available for draw');
    error.status = 400;
    throw error;
  }

  const selected =
    selectedMemberId && eligibleMembers.some((member) => member.id === Number(selectedMemberId))
      ? eligibleMembers.find((member) => member.id === Number(selectedMemberId))
      : eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];

  await saveRandomDraw({
    monthId,
    eligibleMemberIds: eligibleMembers.map((member) => member.id),
    selectedMemberId: selected.id,
    randomProof: crypto.randomUUID(),
  });

  return {
    selectedMember: selected,
    eligibleMembers,
  };
}
