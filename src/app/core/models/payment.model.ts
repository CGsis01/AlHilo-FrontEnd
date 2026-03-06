import { Repair } from "./repair.model";
import { PaymentType } from "./payment-type.model";
import { User } from "./user.model";

export interface Payment {
  id: string;
  repair: Repair;
  paymentType: PaymentType;
  amount: number;
  isDebit: boolean;
  voucherId?: string;
  isAdvance: boolean;
  createdBy: User;
  paymentDate: Date;
}
