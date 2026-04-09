import {
  createNewCycle,
  finalizeRandomDraw,
  listCycles,
  markContributionPaid,
  removeCycle,
} from '../services/cycleService.js';

export async function getCyclesHandler(_req, res, next) {
  try {
    res.json(await listCycles());
  } catch (err) {
    next(err);
  }
}

export async function updateContributionHandler(req, res, next) {
  try {
    const updated = await markContributionPaid(Number(req.params.id), req.body.status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function createCycleHandler(req, res, next) {
  try {
    const cycle = await createNewCycle(req.body);
    res.status(201).json(cycle);
  } catch (err) {
    next(err);
  }
}

export async function deleteCycleHandler(req, res, next) {
  try {
    res.json(await removeCycle(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function randomDrawHandler(req, res, next) {
  try {
    const result = await finalizeRandomDraw(Number(req.params.id), req.body.selectedMemberId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
