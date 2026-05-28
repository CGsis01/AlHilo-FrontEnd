import { Repair } from '../../core/models/repair.model';

export function upsertRepairById(repairs: Repair[], repair: Repair): Repair[] {
  const repairIndex = repairs.findIndex(currentRepair => currentRepair.id === repair.id);

  if (repairIndex === -1) {
    return [...repairs, repair];
  }

  const nextRepairs = repairs.slice();
  nextRepairs[repairIndex] = repair;

  return nextRepairs;
}

export function removeRepairById(repairs: Repair[], repairId: string): Repair[] {
  return repairs.filter(repair => repair.id !== repairId);
}