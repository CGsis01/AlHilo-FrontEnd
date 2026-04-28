import { User } from "./user.model";

export interface RepairComment {
  id: string;
  repair_id: string;
  comment: string;
  updated_comment: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  author?: User;
}
