export interface GarmentTicketData {
  qrCodeDataUrl: string;
  garmentName: string;
  repairTypeName: string;
  comment: string;
  repairId: string;
  customerName?: string;
  receivedDate?: Date;
  estimatedDeliveryDate?: Date;
}