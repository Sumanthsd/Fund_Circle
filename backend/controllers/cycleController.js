import {
  createNewCycle,
  finalizeRandomDraw,
  listCycles,
  markContributionPaid,
  removeCycle,
  startCycle,
} from '../services/cycleService.js';
import { bumpDataRevision } from '../services/realtimeService.js';

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
    bumpDataRevision();
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function createCycleHandler(req, res, next) {
  try {
    const cycle = await createNewCycle(req.body);
    bumpDataRevision();
    res.status(201).json(cycle);
  } catch (err) {
    next(err);
  }
}

export async function deleteCycleHandler(req, res, next) {
  try {
    const result = await removeCycle(Number(req.params.id));
    bumpDataRevision();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function randomDrawHandler(req, res, next) {
  try {
    const result = await finalizeRandomDraw(Number(req.params.id), req.body.selectedMemberId);
    bumpDataRevision();
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function startCycleHandler(req, res, next) {
  try {
    const updated = await startCycle(Number(req.params.id));
    bumpDataRevision();
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
