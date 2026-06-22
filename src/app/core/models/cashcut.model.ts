export interface CashCutSection {
  name: string;
  transactions: number;
  amount: number;
}

export interface CashCutMovement {
  payment_id: string;
  repair_id: string;
  customer_name: string;
  payment_type: string;
  amount: number;
  is_advance: boolean;
  voucher_id?: string;
  created_at: string;
}

export interface CardDetail {
  voucher_id: string;
  is_debit: boolean;
  amount: number;
}

export interface CashCutResponse {
  cash_cut_date: string;
  cash: CashCutSection;
  card: CashCutSection;
  transfer: CashCutSection;
  advances: CashCutSection;
  settlements: CashCutSection;
  total_transactions: number;
  grand_total: number;
  card_details: CardDetail[];
  movements: CashCutMovement[];
}