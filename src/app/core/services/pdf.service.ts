import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CashCutMovement, CashCutResponse } from '../models/cashcut.model';

@Injectable({
  providedIn: 'root'
})

export class PdfService {
    generateCashCut(cashCut: CashCutResponse, created_by_user_name: string): void {
        const doc = new jsPDF();

        let y = 20;

        doc.setFontSize(18);
        doc.text('CORTE DE CAJA', 15, y);

        y += 10;

        const formatedCashCutDate = new Date(cashCut.cash_cut_date).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });

        doc.setFontSize(11);
        doc.text(`Fecha: ${formatedCashCutDate }`, 15, y);

        y += 6;

        const formatedDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true });
       
        doc.setFontSize(11);
        doc.text(`Generado: ${formatedDate}`, 15, y);

        y += 6;

        doc.setFontSize(11);
        doc.text(`Usuario: ${created_by_user_name}`, 15, y);

        y += 10;

        this.drawMovements(doc, cashCut.movements, y);

        y += 15 + cashCut.movements.length * 8;

        doc.text(`Efectivo: $${cashCut.cash.amount.toFixed(2)}`, 15, y);

        y += 6;

        doc.text(`Tarjeta: $${cashCut.card.amount.toFixed(2)}`, 15, y);

        y += 6;

        doc.text(`Anticipos: $${cashCut.advances.amount.toFixed(2)}`, 15, y);

        y += 6;

        doc.text(`Liquidaciones: $${cashCut.settlements.amount.toFixed(2)}`, 15, y);

        y += 10;

        doc.setFontSize(13);
        doc.text(`TOTAL: $${cashCut.grand_total.toFixed(2)}`, 15, y);

        doc.save(`Corte de caja - ${formatedCashCutDate }.pdf`);
    }

    private drawMovements(doc: jsPDF, movements: CashCutMovement[], startY: number) {
        autoTable(doc, {
            startY,
            head: [[ 'Hora', 'Cliente', 'Pago', 'Concepto', 'Voucher', 'Monto' ]],
            body: movements.map(m => [
                new Date(m.created_at).toLocaleTimeString(),
                m.customer_name,
                m.payment_type,
                m.is_advance ? 'Anticipo' : 'Liquidación',
                m.voucher_id ?? '',
                `$${m.amount.toFixed(2)}`
                ])});
    }
}