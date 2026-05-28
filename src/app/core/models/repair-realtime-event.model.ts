import { Repair } from './repair.model';

export interface RepairRealtimeEvent {
  event: 'repair.created' | 'repair.status_changed' | 'repair.item_status_changed' | 'repair.assignment_changed' | string;
  repair_id: string;
  repair_item_id?: string | null;
  status_id?: string | null;
  updated_by?: string | null;
  updated_at: string;
  repair?: Repair;
}
