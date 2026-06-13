import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CashCutMovement, CashCutResponse } from '../models/cashcut.model';
import { AttendanceExportSummaryRow, AttendanceResponse } from '@core/models/attendance.model';

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

    generateAttendanceReport(summaryRows: AttendanceExportSummaryRow[], detailRows: AttendanceResponse[], created_by_user_name: string): void {
        const doc = new jsPDF();

        let y = 20;

        doc.setFontSize(18);
        doc.text('REPORTE DE ASISTENCIA', 15, y);

        y += 10;

        const formatedAttendanceDate = new Date(detailRows[0]?.clockIn).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const minClockIn = new Date(Math.min(...detailRows.map(s => new Date(s.clockIn).getTime())));
        const maxClockOut = new Date(Math.max(...detailRows.map(s => s.clockOut ? new Date(s.clockOut).getTime() : new Date().getTime())));

        doc.setFontSize(11);

        if(minClockIn.toDateString() === maxClockOut.toDateString()) {
            doc.text(`Fecha: ${formatedAttendanceDate }`, 15, y);
        } else {
            const formatedMinClockIn = new Date(minClockIn).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const formatedMaxClockOut = new Date(maxClockOut).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            doc.text(`Rango: ${formatedMinClockIn } - ${formatedMaxClockOut}`, 15, y);
        }

        y += 6;

        const formatedDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true });

        doc.setFontSize(11);
        doc.text(`Generado: ${formatedDate}`, 15, y);

        y += 6;

        doc.setFontSize(11);
        doc.text(`Usuario: ${created_by_user_name}`, 15, y);

        y += 10;

        doc.text('Concentrado de horas por empleado y día', 15, y);

        y += 6;

        this.drawSummary(doc, summaryRows, y);

        y += 15 + summaryRows.length * 8;

        doc.text('Detalle por día', 15, y);

        y += 6;

        const users = summaryRows.reduce((acc, row) => {
            acc[row.userId] = row.userName;
            return acc;
        }, {} as Record<string, string>);        

        this.drawDetails(doc, detailRows, users, y);

        // if is only one user, get the name of the user to concatenate in the file name, otherwise use null
        const fileNameUserPart = Object.keys(users).length === 1 ? users[Object.keys(users)[0]] : '';

        if(fileNameUserPart) {
            doc.save(`Reporte de asistencia - ${ fileNameUserPart } - ${ formatedDate }.pdf`);
        } else {
            doc.save(`Reporte de asistencia - ${ formatedDate }.pdf`);
        }
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

    private drawSummary(doc: jsPDF, summaryRows: AttendanceExportSummaryRow[], startY: number) {
        autoTable(doc, {
            startY,
            head: [[ 'Empleado', 'Día', 'Duración' ]],
            body: summaryRows.map(m => [
                m.userName,
                m.dayLabel,
                this.formatDuration(m.totalMs)
                ])});
    }

    private drawDetails(doc: jsPDF, detailRows: AttendanceResponse[], users: Record<string, string>, startY: number) {
        autoTable(doc, {
            startY,
            head: Object.keys(users).length > 1 
                ? [[ 'Empleado', 'Día', 'Entrada', 'Salida', 'Duración' ]] : [[ 'Día', 'Entrada', 'Salida', 'Duración' ]],
            body: [...detailRows].sort((a, b) => {
                    const userA = users[a.userId] || a.userId;
                    const userB = users[b.userId] || b.userId;
                    if (userA < userB) return -1;
                    if (userA > userB) return 1;
                    return new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime();
                }).map(m => 
                    Object.keys(users).length > 1
                    ?
                        [
                            users[m.userId] || m.userId,
                            new Date(m.clockIn).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit'}),
                            new Date(m.clockIn).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true }),
                            m.clockOut ? new Date(m.clockOut).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true }) : '-',
                            m.clockOut ? this.formatDuration(new Date(m.clockOut).getTime() - new Date(m.clockIn).getTime()) : ''
                        ]
                    :
                        [
                            new Date(m.clockIn).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit'}),
                            new Date(m.clockIn).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true }),
                            m.clockOut ? new Date(m.clockOut).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true }) : '-',
                            m.clockOut ? this.formatDuration(new Date(m.clockOut).getTime() - new Date(m.clockIn).getTime()) : ''
                        ]
            )});
    }

    private formatDuration(totalMs: number): string {
        const totalSeconds = Math.floor(totalMs / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }
}