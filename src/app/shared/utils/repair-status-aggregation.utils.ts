import { Repair, RepairStatusEnum } from '../../core/models/repair.model';

/**
 * Aggregate a repair status from item-level statuses.
 * Rules:
 * - All delivered => delivered
 * - All validated => validated
 * - Any in validation => in validation
 * - Any in progress => in progress
 * - Otherwise => pending
 */
export function getAggregateRepairStatus(repair: Repair): RepairStatusEnum {
  const itemStatuses = (repair.items || [])
    .filter(item => !item.isPatternSource)
    .map(item => item.repairStatus?.name)
    .filter((status): status is RepairStatusEnum => !!status) as RepairStatusEnum[];

  if (itemStatuses.length === 0) {
    return (repair.repairStatus?.name as RepairStatusEnum) || RepairStatusEnum.PENDING;
  }

  const statusSet = new Set(itemStatuses);

  if (statusSet.size === 1 && statusSet.has(RepairStatusEnum.DELIVERED)) {
    return RepairStatusEnum.DELIVERED;
  }

  if (statusSet.size === 1 && statusSet.has(RepairStatusEnum.VALIDATED)) {
    return RepairStatusEnum.VALIDATED;
  }

  if (statusSet.has(RepairStatusEnum.IN_VALIDATION)) {
    return RepairStatusEnum.IN_VALIDATION;
  }

  if (statusSet.has(RepairStatusEnum.IN_PROGRESS)) {
    return RepairStatusEnum.IN_PROGRESS;
  }

  return RepairStatusEnum.PENDING;
}
