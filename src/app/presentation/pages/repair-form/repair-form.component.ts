import { Component, OnInit, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { catchError, of } from "rxjs";
import { CommonModule } from "@angular/common";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { environment } from "../../../../environments/environment";
import { Router } from "@angular/router";
import { RepairUseCases } from "../../../domain/usecases/repair.usecases";

import { GarmentUseCases } from "../../../domain/usecases/garment.usecases";
import { Garment } from "@core/models/garment.model";

import { RepairTypeUseCases } from "../../../domain/usecases/repair-type.usecases";
import { RepairType } from "../../../core/models/repair-type.model";

import { RepairStatusUseCases } from "../../../domain/usecases/repair-status.usecases";
import { RepairStatus } from "../../../core/models/repair-status.model";

import { PaymentTypeUseCases } from "../../../domain/usecases/payment-type.usecases";
import { PaymentType } from "../../../core/models/payment-type.model";
import { PaymentUseCases } from "../../../domain/usecases/payment.usecases";

import { ClientUseCases } from '../../../domain/usecases/client.usecases';
import { Client } from '../../../core/models/client.model';
import { ClientModalComponent } from '../../components/client-modal/client-modal.component';
import { ClientSelectionModalComponent } from '../../components/client-selection-modal/client-selection-modal.component';
import { RepairItemsEditorComponent } from "../../components/repair-items-editor/repair-items-editor.component";
import { RepairItem } from "../../../core/models/repair-item.model";
import { forkJoin } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { Repair, RepairStatusEnum } from "@core/models/repair.model";
import { repairImpressionTicket } from "../../../shared/utils/repairImpressionTicket.utils";
import { WhatsappApiService } from "../../../core/services/whatsapp-api.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthService } from "../../../core/services/auth.service";
import { DateFormatDirective } from "../../../shared/directives/date-format.directive";
import { ConvertHtmlAPdf } from "../../../shared/utils/convertHtmlAPdf";
import { GarmentTicketData } from "../../components/garment-selector-modal/garment-selector-modal.component";

@Component({
  selector: "app-repair-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClientModalComponent,
    ClientSelectionModalComponent,
    RepairItemsEditorComponent,
    DateFormatDirective,
  ],
  templateUrl: "./repair-form.component.html",
  styleUrls: ["./repair-form.component.scss"],
})
export class RepairFormComponent implements OnInit {
  // ─── Repair ───────────────────────────────────────────────────
  repairForm!: FormGroup;
  isLoading = signal(false);
  estimatedDeliveryDate = signal<Date | null>(null);

  errorMessage = "";

  repair: Repair | null = null;
  repairId: string = "";

  // ─── Customer ─────────────────────────────────────────────────
  isSearching = signal(false);
  showClientModal = signal(false);
  showClientSelectionModal = signal(false);

  searchMessage = "";

  selectedClient: Client | null = null;
  matchingClients: Client[] = [];

  // ─── Repair Items ─────────────────────────────────────────────
  selectedRepairType: RepairType | null = null;

  repairItems: RepairItem[] = [];

  // ─── Repair Ticket ────────────────────────────────────────────
  showTicket = signal(false);
  activeTicketItem: RepairItem | null = null;
  activeTicketIndex = 0;

  qrCodeDataUrl = "";

  // ─── Garment Print Ticket ─────────────────────────────────────
  showGarmentPrintTicket = false;
  garmentTicketData: GarmentTicketData | null = null;

  // ─── Advance Ticket ───────────────────────────────────────────
  showAdvancePaymentTicket = signal(false);
  pendingAdvancePaymentTicket = signal(false);

  advanceVoucherId = "";

  advancePaymentAmount = 0;
  advancePaymentCashAmount = 0;
  advancePaymentCardAmount = 0;
  advancePaymentMinimum = 0;
  advancePaymentMaximum = 0;
  advancePaymentDate: Date = new Date();

  advancePaymentType: "cash" | "card" | "mixed" = "cash";
  advanceCardType: "debit" | "credit" = "debit";

  garments = toSignal(
    this.garmentUseCases
      .getActiveGarments(this.authService.currentUser?.store?.id)
      .pipe(
        catchError((err) => {
          console.error("Error loading available garments: ", err);
          return of([] as Garment[]);
        }),
      ),
    { initialValue: [] as Garment[] },
  );

  repairTypes = toSignal(
    this.repairTypeUseCases.getAllRepairTypes().pipe(
      catchError((err) => {
        console.error("Error loading available repair types: ", err);
        return of([] as RepairType[]);
      }),
    ),
    { initialValue: [] as RepairType[] },
  );

  repairStatuses = toSignal(
    this.repairStatusUseCases.getAllRepairStatuses().pipe(
      catchError((err) => {
        console.error("Error loading available repair statuses: ", err);
        return of([] as RepairStatus[]);
      }),
    ),
    { initialValue: [] as RepairStatus[] },
  );

  paymentTypes = toSignal(
    this.paymentTypeUseCases.getAllPaymentTypes().pipe(
      catchError((err) => {
        console.error("Error loading available payment types: ", err);
        return of([] as PaymentType[]);
      }),
    ),
    { initialValue: [] as PaymentType[] },
  );

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private repairUseCases: RepairUseCases,
    private clientUseCases: ClientUseCases,
    private garmentUseCases: GarmentUseCases,
    private repairTypeUseCases: RepairTypeUseCases,
    private repairStatusUseCases: RepairStatusUseCases,
    private paymentTypeUseCases: PaymentTypeUseCases,
    private paymentUseCases: PaymentUseCases,
    private repairImpressionTicket: repairImpressionTicket,
    private whatsappApiService: WhatsappApiService,
    private toastService: ToastService,
    private authService: AuthService,
    private convertHtmlAPdfService: ConvertHtmlAPdf,
  ) {}

  ngOnInit(): void {
    this.repairId = crypto.randomUUID();

    this.repairForm = this.fb.group({
      customerName: ["", Validators.required],
      customerPhone: [
        "",
        [Validators.required, Validators.pattern(/^\d{10}$/)],
      ],
      customerEmail: ["", Validators.email],
      customerId: ["", Validators.required],
      advancePayment: [
        "",
        [
          Validators.pattern(/^\d+(\.\d+)?$/),
          Validators.min(0),
          this.advancePaymentMinValidator(),
          this.advancePaymentMaxValidator(),
        ],
      ],
      advancePaymentCash: [
        "",
        [Validators.pattern(/^\d+(\.\d+)?$/), Validators.min(0)],
      ],
      advancePaymentCard: [
        "",
        [Validators.pattern(/^\d+(\.\d+)?$/), Validators.min(0)],
      ],
      advancePaymentType: ["cash"],
      advanceVoucherId: [""],
      advanceCardType: ["debit"],
      isExpress: [false],
      estimatedDeliveryDate: ["", Validators.required],
      notes: [""],
    });

    this.repairUseCases.getRepairsEstimatedTime().subscribe((estimatedTime) => {
      this.estimatedDeliveryDate.set(
        this.addWorkMinutes(new Date(), estimatedTime),
      );
      this.repairForm
        .get("estimatedDeliveryDate")
        ?.setValue(this.estimatedDeliveryDate()?.toISOString().split("T")[0]);
    });

    this.repairForm
      .get("customerPhone")
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((phone) => {
        if (phone && phone.length === 10) {
          this.searchClientByPhone(phone);
        } else {
          this.selectedClient = null;
          this.searchMessage = "";
        }
      });

    this.repairForm
      .get("advancePaymentType")
      ?.valueChanges.subscribe((type) => {
        this.syncAdvancePaymentByType(type as "cash" | "card" | "mixed");
      });
  }

  // ─── Repair ───────────────────────────────────────────────────
  onSubmit(): void {
    const itemsValid =
      this.repairItems.length > 0 &&
      this.repairItems.every(
        (i) =>
          i.garment.name?.trim() &&
          i.repairType &&
          i.description?.trim() &&
          i.estimatedPrice > 0,
      );

    const advanceControl = this.repairForm.get("advancePayment");
    advanceControl?.markAsTouched();

    if (this.repairForm.invalid || !this.selectedClient || !itemsValid) {
      if (!itemsValid) {
        this.errorMessage = "Agrega al menos una prenda con todos sus datos.";
      } else if (advanceControl?.hasError("minAdvance")) {
        this.errorMessage =
          "El anticipo debe ser al menos el 50% del total estimado.";
      } else if (advanceControl?.hasError("maxAdvance")) {
        this.errorMessage = "El anticipo no puede ser mayor al total estimado.";
      }

      return;
    }

    this.isLoading.set(true);
    this.errorMessage = "";

    const formValue = this.repairForm.value;
    const selectedAdvancePaymentType = (formValue.advancePaymentType ||
      "cash") as "cash" | "card" | "mixed";
    const cashAdvance = this.getAdvanceNumericValue(
      formValue.advancePaymentCash,
    );
    const cardAdvance = this.getAdvanceNumericValue(
      formValue.advancePaymentCard,
    );
    const rawAdvance =
      selectedAdvancePaymentType === "mixed"
        ? Math.round((cashAdvance + cardAdvance) * 100) / 100
        : this.getAdvanceNumericValue(formValue.advancePayment);
    const totalPrice = this.repairItems.reduce(
      (s, i) => s + i.estimatedPrice,
      0,
    );
    const advanceVoucherId = (formValue.advanceVoucherId || "").trim();
    const selectedAdvanceCardType = (formValue.advanceCardType || "debit") as
      | "debit"
      | "credit";
    const minimumAdvance = this.advancePaymentMinimum;

    if (
      selectedAdvancePaymentType === "mixed" &&
      Number.isFinite(rawAdvance) &&
      minimumAdvance > 0 &&
      rawAdvance < minimumAdvance
    ) {
      const existingErrors = advanceControl?.errors ?? {};
      advanceControl?.setErrors({
        ...existingErrors,
        minAdvance: { min: minimumAdvance, actual: rawAdvance },
      });
      advanceControl?.markAsTouched();
      this.errorMessage =
        "El anticipo debe ser al menos el 50% del total estimado.";
      this.isLoading.set(false);

      return;
    }

    if (Number.isFinite(rawAdvance) && rawAdvance > totalPrice) {
      const existingErrors = advanceControl?.errors ?? {};

      advanceControl?.setErrors({
        ...existingErrors,
        maxAdvance: { max: totalPrice, actual: rawAdvance },
      });
      advanceControl?.markAsTouched();
      this.errorMessage = "El anticipo no puede ser mayor al total estimado.";
      this.isLoading.set(false);

      return;
    }

    if (
      rawAdvance > 0 &&
      selectedAdvancePaymentType === "card" &&
      !advanceVoucherId
    ) {
      this.errorMessage =
        "Ingresa el ID del voucher para registrar el anticipo con tarjeta.";
      this.isLoading.set(false);

      return;
    }

    if (
      selectedAdvancePaymentType === "mixed" &&
      cardAdvance > 0 &&
      !advanceVoucherId
    ) {
      this.errorMessage =
        "Ingresa el ID del voucher para registrar el anticipo con tarjeta.";
      this.isLoading.set(false);

      return;
    }

    const repairFormData = { ...formValue };

    delete repairFormData.advancePaymentCash;
    delete repairFormData.advancePaymentCard;

    const repairData = {
      ...repairFormData,
      repairId: this.repairId,
      customerId: this.selectedClient.id,
      customerName: this.selectedClient.fullName,
      customerPhone: this.selectedClient.personalPhone,
      customerEmail: this.selectedClient.email,
      estimatedPrice: totalPrice,
      repairStatus: this.repairStatuses().find(
        (status) => status.name === RepairStatusEnum.PENDING,
      ),
      advancePayment: rawAdvance > 0 ? rawAdvance : undefined,
      items: this.repairItems,
    };

    this.repairUseCases.createRepair(repairData).subscribe({
      next: (repair) => {
        if (rawAdvance > 0) {
          const advanceCashAmount =
            selectedAdvancePaymentType === "mixed"
              ? cashAdvance
              : selectedAdvancePaymentType === "cash"
                ? rawAdvance
                : 0;
          const advanceCardAmount =
            selectedAdvancePaymentType === "mixed"
              ? cardAdvance
              : selectedAdvancePaymentType === "card"
                ? rawAdvance
                : 0;
          const needsCash = advanceCashAmount > 0;
          const needsCard = advanceCardAmount > 0;
          const paymentTypeCash = needsCash
            ? this.resolveSelectedAdvancePaymentType("cash")
            : undefined;
          const paymentTypeCard = needsCard
            ? this.resolveSelectedAdvancePaymentType("card")
            : undefined;

          if (
            (needsCash && !paymentTypeCash) ||
            (needsCard && !paymentTypeCard)
          ) {
            if (
              needsCash &&
              !paymentTypeCash &&
              needsCard &&
              !paymentTypeCard
            ) {
              this.toastService.show(
                "La reparación se creó, pero no se pudieron mapear los tipos de pago del anticipo.",
                "error",
              );
            } else if (needsCash && !paymentTypeCash) {
              this.toastService.show(
                "La reparación se creó, pero no se pudo mapear el tipo de pago del anticipo en efectivo.",
                "error",
              );
            } else {
              this.toastService.show(
                "La reparación se creó, pero no se pudo mapear el tipo de pago del anticipo con tarjeta.",
                "error",
              );
            }
            
            this.handleRepairCreated(repair);
           
            return;
          }

          const paymentRequests = [];

          if (needsCash && paymentTypeCash) {
            paymentRequests.push(
              this.paymentUseCases.createPayment({
                repair: repair,
                paymentType: paymentTypeCash,
                amount: advanceCashAmount,
                isDebit: false,
                isAdvance: true,
                createdBy: repair.createdBy,
                paymentDate: repair.createdAt,
              }),
            );
          }

          if (needsCard && paymentTypeCard) {
            paymentRequests.push(
              this.paymentUseCases.createPayment({
                repair: repair,
                paymentType: paymentTypeCard,
                amount: advanceCardAmount,
                isDebit: selectedAdvanceCardType === "debit",
                voucherId: advanceVoucherId || undefined,
                isAdvance: true,
                createdBy: repair.createdBy,
                paymentDate: repair.createdAt,
              }),
            );
          }

          forkJoin(paymentRequests).subscribe({
            next: () => {
              this.prepareAdvancePaymentTicket(
                repair,
                rawAdvance,
                selectedAdvancePaymentType,
                selectedAdvanceCardType,
                advanceVoucherId,
                advanceCashAmount,
                advanceCardAmount,
              );

              this.handleRepairCreated(repair);
            },
            error: () => {
              this.toastService.show(
                "La reparación se creó, pero no se pudo registrar el anticipo.",
                "error",
              );
              this.handleRepairCreated(repair);
            },
          });

          return;
        }

        this.handleRepairCreated(repair);
      },
      error: (error) => {
        this.errorMessage =
          error.message || "Failed to create repair. Please try again.";
        this.isLoading.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(["/repairs"]);
  }

  // ─── Customer ─────────────────────────────────────────────────
  searchClientByPhone(phone: string): void {
    this.isSearching.set(true);
    this.searchMessage = "";

    this.clientUseCases.searchByPhone(phone).subscribe({
      next: (result) => {
        const clients = this.normalizeClientSearchResult(result);

        const existClientMainPhone = clients.filter(c => c.personalPhone === phone);

        if(existClientMainPhone.length === 0){
          this.selectedClient = null;
          this.matchingClients = [];
          this.showClientSelectionModal.set(false);
          this.clearClientData();

          // Auto-open modal when client not found
          setTimeout(() => this.openClientModal(), 300);
        }
      },
      error: () => {
        this.searchMessage = "Error al buscar cliente";
      },
    });

    this.isSearching.set(false);
  }

  fillClientData(client: Client): void {
    this.repairForm.patchValue({
      customerId: client.id,
      customerName: client.fullName,
      customerPhone: client.personalPhone,
      customerEmail: client.email || "",
    });
  }

  clearClientData(): void {
    this.repairForm.patchValue({
      customerName: "",
      customerEmail: "",
    });
  }

  onClientCreated(client: Client): void {
    this.selectedClient = client;
    this.matchingClients = [];
    this.fillClientData(client);
    this.searchMessage = "✓ Cliente creado exitosamente";

    this.showClientModal.set(false);
  }

  onClientSelected(client: Client): void {
    this.selectedClient = client;
    this.matchingClients = [];
    this.fillClientData(client);
    this.searchMessage = '✓ Cliente seleccionado';
    this.showClientSelectionModal.set(false);
  }

  openClientModal(): void {
    this.showClientModal.set(true);
  }

  closeClientModal(): void {
    this.showClientModal.set(false);
  }

  closeClientSelectionModal(): void {
    this.showClientSelectionModal.set(false);
    this.matchingClients = [];
  }

  // ─── Repair Items ─────────────────────────────────────────────
  onItemsChange(items: RepairItem[]): void {
    this.repairItems = items;
    this.advancePaymentMinimum = this.calculateAdvancePaymentMinimum(items);
    this.advancePaymentMaximum = this.calculateAdvancePaymentMaximum(items);

    // Calculate total estimated time from repair items
    const totalEstimatedTime = items.reduce(
      (sum, item) => sum + (item.repairType?.estimatedTime || 0),
      0,
    );

    // Calculate and set estimated delivery date using work schedule
    const deliveryDate = this.addWorkMinutes(
      new Date(this.estimatedDeliveryDate() || new Date()),
      totalEstimatedTime,
    );
    this.repairForm
      .get("estimatedDeliveryDate")
      ?.setValue(deliveryDate.toISOString().split("T")[0]);

    const formattedAdvance = this.formatToTwoDecimals(
      this.advancePaymentMinimum,
    );
    const paymentType = this.repairForm.get("advancePaymentType")?.value as
      | "cash"
      | "card"
      | "mixed";

    if (paymentType === "mixed") {
      this.repairForm.patchValue(
        {
          advancePaymentCash: formattedAdvance,
          advancePaymentCard: this.formatToTwoDecimals(0),
        },
        { emitEvent: false },
      );
      this.updateMixedAdvanceTotal();
    } else {
      this.repairForm
        .get("advancePayment")
        ?.setValue(formattedAdvance, { emitEvent: false });
    }

    this.repairForm
      .get("advancePayment")
      ?.updateValueAndValidity({ emitEvent: false });
  }

  // ─── Repair Ticket ────────────────────────────────────────────
  closeTicket(): void {
    this.showTicket.set(false);
    this.activeTicketItem = null;
    this.activeTicketIndex = 0;
    if (this.pendingAdvancePaymentTicket()) {
      this.openAdvancePaymentTicket();
    }
  }

  printTicket(): void {
    void this.triggerWorkOrderPrint();
  }

  // ─── Garment Print Ticket ─────────────────────────────────────
  async onPrintTicketRequest(data: GarmentTicketData): Promise<void> {
    this.garmentTicketData = data;
    this.showGarmentPrintTicket = true;

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );

    window.addEventListener(
      "afterprint",
      () => {
        this.showGarmentPrintTicket = false;
        this.garmentTicketData = null;
      },
      { once: true },
    );

    window.print();
  }

  // ─── Advance Ticket ───────────────────────────────────────────
  getAdvanceRemainingBalance(): number {
    const total = this.repair?.estimatedPrice ?? 0;
    const advance =
      this.advancePaymentAmount > 0
        ? this.advancePaymentAmount
        : (this.repair?.advancePayment ?? 0);

    return Math.max(0, Math.round((total - advance) * 100) / 100);
  }

  onAdvancePaymentInput(event: Event): void {
    if (this.repairForm.get("advancePaymentType")?.value === "mixed") {
      return;
    }

    const sanitizedValue = this.onDecimalInput(event);

    this.repairForm.get("advancePayment")?.setValue(sanitizedValue);
  }

  onAdvancePaymentCashInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);

    this.repairForm.get("advancePaymentCash")?.setValue(sanitizedValue);
    this.updateMixedAdvanceTotal();
  }

  onAdvancePaymentCardInput(event: Event): void {
    const sanitizedValue = this.onDecimalInput(event);

    this.repairForm.get("advancePaymentCard")?.setValue(sanitizedValue);
    this.updateMixedAdvanceTotal();
  }

  onAdvancePaymentBlur(
    controlName: "advancePayment" | "advancePaymentCash" | "advancePaymentCard",
  ): void {
    const control = this.repairForm.get(controlName);

    if (!control) {
      return;
    }

    const formattedValue = this.formatToTwoDecimals(control.value);

    control.setValue(formattedValue);

    if (controlName !== "advancePayment") {
      this.updateMixedAdvanceTotal();

      const totalControl = this.repairForm.get("advancePayment");

      totalControl?.markAsTouched();
      totalControl?.updateValueAndValidity({ emitEvent: false });
    }
  }

  closeAdvancePaymentTicket(): void {
    this.showAdvancePaymentTicket.set(false);
    this.pendingAdvancePaymentTicket.set(false);
    this.router.navigate(["/repairs"]);
  }

  printAdvancePaymentTicket(): void {
    this.repairImpressionTicket.simplePrint();
  }

  onDecimalInput(event: Event): string {
    const input = event.target as HTMLInputElement;

    const sanitizedValue = input.value
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }

    return sanitizedValue;
  }

  // ─── Helepers ─────────────────────────────────────────────────

  get itemsValid(): boolean {
    return (
      this.repairItems.length > 0 &&
      this.repairItems.every(
        (i) =>
          i.garment?.name?.trim() &&
          i.repairType &&
          i.description?.trim() &&
          i.estimatedPrice > 0,
      )
    );
  }

  get hasAdvancePayment(): boolean {
    const paymentType = this.repairForm?.get("advancePaymentType")?.value as
      | "cash"
      | "card"
      | "mixed";
    const amount =
      paymentType === "mixed"
        ? this.getMixedAdvanceTotal()
        : Number(this.repairForm?.get("advancePayment")?.value);

    return Number.isFinite(amount) && amount > 0;
  }

  get hasCardAdvancePayment(): boolean {
    const paymentType = this.repairForm?.get("advancePaymentType")?.value as
      | "cash"
      | "card"
      | "mixed";
    if (paymentType === "card") {
      return this.hasAdvancePayment;
    }
    if (paymentType === "mixed") {
      return (
        this.getAdvanceNumericValue(
          this.repairForm?.get("advancePaymentCard")?.value,
        ) > 0
      );
    }
    return false;
  }

  private formatToTwoDecimals(value: unknown): string {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "";
    }

    return numericValue.toFixed(2);
  }

  private getAdvanceNumericValue(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private getMixedAdvanceTotal(): number {
    const cash = this.getAdvanceNumericValue(
      this.repairForm?.get("advancePaymentCash")?.value,
    );
    const card = this.getAdvanceNumericValue(
      this.repairForm?.get("advancePaymentCard")?.value,
    );
    return Math.round((cash + card) * 100) / 100;
  }

  private updateMixedAdvanceTotal(): void {
    const total = this.getMixedAdvanceTotal();
    const formattedTotal = this.formatToTwoDecimals(total);
    this.repairForm
      .get("advancePayment")
      ?.setValue(formattedTotal, { emitEvent: false });
    this.repairForm
      .get("advancePayment")
      ?.updateValueAndValidity({ emitEvent: false });
  }

  private syncAdvancePaymentByType(
    paymentType: "cash" | "card" | "mixed",
  ): void {
    if (paymentType === "mixed") {
      const cashControl = this.repairForm.get("advancePaymentCash");
      const cardControl = this.repairForm.get("advancePaymentCard");
      const cashValue = cashControl?.value;
      const cardValue = cardControl?.value;

      if (
        (cashValue === null || cashValue === undefined || cashValue === "") &&
        (cardValue === null || cardValue === undefined || cardValue === "")
      ) {
        const currentTotal = this.getAdvanceNumericValue(
          this.repairForm.get("advancePayment")?.value,
        );
        cashControl?.setValue(this.formatToTwoDecimals(currentTotal), {
          emitEvent: false,
        });
        cardControl?.setValue(this.formatToTwoDecimals(0), {
          emitEvent: false,
        });
      }

      this.updateMixedAdvanceTotal();
      return;
    }

    if (paymentType === "cash") {
      const cashAmount = this.getAdvanceNumericValue(
        this.repairForm.get("advancePaymentCash")?.value,
      );
      if (cashAmount > 0) {
        this.repairForm
          .get("advancePayment")
          ?.setValue(this.formatToTwoDecimals(cashAmount), {
            emitEvent: false,
          });
      }
    }

    if (paymentType === "card") {
      const cardAmount = this.getAdvanceNumericValue(
        this.repairForm.get("advancePaymentCard")?.value,
      );
      if (cardAmount > 0) {
        this.repairForm
          .get("advancePayment")
          ?.setValue(this.formatToTwoDecimals(cardAmount), {
            emitEvent: false,
          });
      }
    }

    this.repairForm
      .get("advancePayment")
      ?.updateValueAndValidity({ emitEvent: false });
  }

  private calculateAdvancePaymentMinimum(
    items: RepairItem[] = this.repairItems,
  ): number {
    const totalEstimated = items.reduce(
      (sum, item) => sum + (item.estimatedPrice || 0),
      0,
    );
    return totalEstimated > 0
      ? Math.round((totalEstimated / 2) * 100) / 100
      : 0;
  }

  private calculateAdvancePaymentMaximum(
    items: RepairItem[] = this.repairItems,
  ): number {
    const totalEstimated = items.reduce(
      (sum, item) => sum + (item.estimatedPrice || 0),
      0,
    );
    return totalEstimated > 0 ? Math.round(totalEstimated * 100) / 100 : 0;
  }

  private addWorkMinutes(start: Date, minutes: number): Date {
    let current = this.normalizeToWorkStart(start);
    let remaining = Math.max(0, Math.floor(minutes));

    while (remaining > 0) {
      const period = this.getWorkPeriod(current);
      if (!period) {
        current = this.moveToNextWorkStart(current);
        continue;
      }

      const periodEnd = new Date(current);
      periodEnd.setHours(period.endHour, period.endMinute, 0, 0);
      const availableMinutes = Math.max(
        0,
        Math.ceil((periodEnd.getTime() - current.getTime()) / 60000),
      );

      if (availableMinutes <= 0) {
        current = this.moveToNextWorkStart(current);
        continue;
      }

      const consume = Math.min(remaining, availableMinutes);
      current = new Date(current.getTime() + consume * 60000);
      remaining -= consume;

      if (remaining > 0) {
        current = this.moveToNextWorkStart(current);
      }
    }

    return current;
  }

  private normalizeToWorkStart(date: Date): Date {
    const normalized = new Date(date.getTime());
    const period = this.getWorkPeriod(normalized);

    if (!period) {
      return this.moveToNextWorkStart(normalized);
    }

    const start = new Date(normalized);
    start.setHours(period.startHour, period.startMinute, 0, 0);
    const end = new Date(normalized);
    end.setHours(period.endHour, period.endMinute, 0, 0);

    if (normalized < start) {
      return start;
    }

    if (normalized >= end) {
      return this.moveToNextWorkStart(normalized);
    }

    return normalized;
  }

  private getWorkPeriod(
    date: Date,
  ): {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  } | null {
    const day = date.getDay();

    if (day >= 1 && day <= 5) {
      return { startHour: 8, startMinute: 0, endHour: 17, endMinute: 0 };
    }

    if (day === 6) {
      return { startHour: 10, startMinute: 0, endHour: 14, endMinute: 0 };
    }

    return null;
  }

  private moveToNextWorkStart(date: Date): Date {
    const next = new Date(date.getTime());
    next.setHours(0, 0, 0, 0);

    do {
      next.setDate(next.getDate() + 1);

      const period = this.getWorkPeriod(next);

      if (period) {
        next.setHours(period.startHour, period.startMinute, 0, 0);

        return next;
      }
    } while (true);
  }

  private advancePaymentMinValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const rawValue = control.value;
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        return null;
      }

      const advance = Number(rawValue);
      if (!Number.isFinite(advance)) {
        return null;
      }

      const minimum = this.advancePaymentMinimum;
      if (minimum <= 0) {
        return null;
      }

      return advance < minimum
        ? { minAdvance: { min: minimum, actual: advance } }
        : null;
    };
  }

  private advancePaymentMaxValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const rawValue = control.value;
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        return null;
      }

      const advance = Number(rawValue);
      if (!Number.isFinite(advance)) {
        return null;
      }

      const maximum = this.advancePaymentMaximum;
      if (maximum <= 0) {
        return null;
      }

      return advance > maximum
        ? { maxAdvance: { max: maximum, actual: advance } }
        : null;
    };
  }

  private resolveSelectedAdvancePaymentType(
    paymentType: "cash" | "card",
  ): PaymentType | undefined {
    const aliases =
      paymentType === "cash" ? ["cash", "efectivo"] : ["card", "tarjeta"];

    return this.paymentTypes().find((type) => {
      const code = type.code?.toLowerCase() || "";
      const name = type.name?.toLowerCase() || "";

      return aliases.some(
        (alias) => code.includes(alias) || name.includes(alias),
      );
    });
  }

  private normalizeClientSearchResult(result: Client | Client[] | null | undefined): Client[] {
    if (!result) {
      return [];
    }

    return Array.isArray(result) ? result : [result];
  }

  private handleRepairCreated(repair: Repair): void {
    this.repair = repair;
    this.isLoading.set(false);
    void this.openTicketAndPrint();
    
    this.whatsappApiService.sendNotification({
      phone: repair.customerPhone,
      customer_name: repair.customerName,
      repair_id: repair.id.substring(0, 8),
      event: 'received'
    }).subscribe(result => {
      if (result.success) {
        this.toastService.show('Notificación WhatsApp enviada al cliente', 'success');
      } else {
        this.toastService.show('No se pudo enviar la notificación WhatsApp', 'error');
      }
    });
  }

  private async openTicketAndPrint(): Promise<void> {
    if (!this.repair) return;

    try {
      const ticketData = await this.repairImpressionTicket.generateTicketData(
        this.repair,
      );
      this.qrCodeDataUrl = ticketData.qrCodeDataUrl;
      await this.triggerWorkOrderPrint(true);
    } catch (error) {
      console.error("Error generating ticket:", error);
    }
  }

  private openAdvancePaymentTicket(): Promise<void> {
    this.pendingAdvancePaymentTicket.set(false);
    this.showAdvancePaymentTicket.set(true);

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(async () => {
          try {
            const blob = await this.convertHtmlAPdfService.convertirHtmlAPdf(
              "AdvancePaymentTicket",
              "AdvancePayment",
            );

            this.paymentUseCases
              .uploadAdvancePaymentPdf(this.repair!.id, blob)
              .subscribe({
                next: () => console.log("PDF enviado al backend"),
                error: (err) => console.error("Error enviando PDF:", err),
              });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "AdvancePayment.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error("Error al generar PDF del anticipo:", error);
          } finally {
            resolve();
          }
        });
      });
    });
  }

  private async triggerWorkOrderPrint(
    redirectAfterPrint = false,
  ): Promise<void> {
    if (!this.repair) {
      return;
    }
    if (this.pendingAdvancePaymentTicket()) {
      await this.openAdvancePaymentTicket();

      this.printAdvancePaymentTicket();
      this.closeAdvancePaymentTicket();

      if (redirectAfterPrint) {
        void this.router.navigate(["/repairs"]);
      }

      return;
    }

    if (redirectAfterPrint) {
      void this.router.navigate(["/repairs"]);
    }
  }

  private prepareAdvancePaymentTicket(
    repair: Repair,
    amount: number,
    paymentType: "cash" | "card" | "mixed",
    cardType: "debit" | "credit",
    voucherId: string,
    cashAmount = 0,
    cardAmount = 0,
  ): void {
    this.advancePaymentAmount = repair.advancePayment ?? amount;
    this.advancePaymentType = paymentType;
    this.advanceCardType = cardType;
    this.advanceVoucherId = voucherId;
    this.advancePaymentCashAmount = cashAmount;
    this.advancePaymentCardAmount = cardAmount;

    const createdAt = repair.createdAt
      ? new Date(repair.createdAt)
      : new Date();
    this.advancePaymentDate = Number.isFinite(createdAt.getTime())
      ? createdAt
      : new Date();

    this.pendingAdvancePaymentTicket.set(true);
  }
}
