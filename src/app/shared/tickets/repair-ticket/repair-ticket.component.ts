import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Repair } from "../../../core/models/repair.model";
import { RepairItem } from "../../../core/models/repair-item.model";

export type RepairTicketPaymentType = "cash" | "card" | "transfer" | "mixed";

export interface RepairTicketPaymentData {
  amountPaid: number;
  cashAmount: number;
  cardAmount: number;
  transferAmount: number;

  paymentType: RepairTicketPaymentType;
  cardType: "debit" | "credit";

  voucherId: string;
  paymentDate: Date;
}

@Component({
  selector: "app-repair-ticket",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./repair-ticket.component.html",
})
export class RepairTicketComponent {
  @Input() mode: "advance" | "settlement" = "advance";
  @Input() repair: Repair | null = null;
  @Input() payment: RepairTicketPaymentData | null = null;

  getRepairTypeNames(item: RepairItem): string {
    const names = (item.repairTypes ?? [])
      .map((type) => type.name)
      .filter(Boolean);

    return names.length > 0 ? names.join(", ") : "Sin tipo";
  }

  getRemainingBalance(): number {
    const total =
      this.mode === "settlement"
        ? (this.repair?.finalPrice ?? this.repair?.estimatedPrice ?? 0)
        : (this.repair?.estimatedPrice ?? 0);

    const previousAdvance =
      this.mode === "settlement" ? (this.repair?.advancePayment ?? 0) : 0;

    const currentPayment = this.payment?.amountPaid ?? 0;

    return Math.max(
      0,
      Math.round((total - previousAdvance - currentPayment) * 100) / 100,
    );
  }

  getAdvancePaid(): number {
    if (this.mode === "advance") {
      return this.payment?.amountPaid ?? 0;
    }

    return this.repair?.advancePayment ?? 0;
  }
  getItemPrice(item: RepairItem): number {
    if (this.mode === "settlement") {
      return item.finalPrice ?? item.estimatedPrice;
    }

    return item.estimatedPrice;
  }
}
