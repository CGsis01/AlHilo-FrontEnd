import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Repair } from '../../core/models/repair.model';
import * as QRCode from 'qrcode';

export interface TicketData {
  qrCodeDataUrl: string;
  repair: Repair;
}

@Injectable({
  providedIn: 'root'
})

export class repairImpressionTicket {
  private printRedirectTimeoutId: number | null = null;

  constructor(private router: Router) {}

  async generateTicketData(repair: Repair): Promise<TicketData> {
    const qrData = {
      repairId: repair.id,
      customer: repair.customerName,
      status: repair.repairStatus.name,
      estimatedDelivery: repair.estimatedDeliveryDate,
      assignedTo: repair.assignedTo?.name || 'No asignado'};

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'}});

      return { qrCodeDataUrl, repair };
    } catch (error) {
      console.error('Error generating QR code:', error);
      
      throw error;
    }
  }

  printTicket(redirectUrl?: string): void {
    let redirected = false;
    const printMedia = typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;

    const redirectAfterPrint = () => {
      if (redirected) return;
      
      redirected = true;
      
      cleanup();
      
      if (redirectUrl) {
        void this.router.navigate([redirectUrl]);
      }
    };

    const onAfterPrint = () => {
      redirectAfterPrint();};

    const onVisibilityChange = () => {
      if (!document.hidden) {
        // Mobile browsers can handle print asynchronously.
        setTimeout(() => redirectAfterPrint(), 150);
      }};

    const onPrintStateChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        redirectAfterPrint();
      }};

    const cleanup = () => {
      window.removeEventListener('afterprint', onAfterPrint);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      if (printMedia) {
        if (typeof printMedia.removeEventListener === 'function') {
          printMedia.removeEventListener('change', onPrintStateChange);
        } else if (typeof printMedia.removeListener === 'function') {
          printMedia.removeListener(onPrintStateChange);
        }
      }

      if (this.printRedirectTimeoutId !== null) {
        clearTimeout(this.printRedirectTimeoutId);
        
        this.printRedirectTimeoutId = null;
      }
    };

    window.addEventListener('afterprint', onAfterPrint, { once: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (printMedia) {
      if (typeof printMedia.addEventListener === 'function') {
        printMedia.addEventListener('change', onPrintStateChange);
      } else if (typeof printMedia.addListener === 'function') {
        printMedia.addListener(onPrintStateChange);
      }
    }

    this.printRedirectTimeoutId = window.setTimeout(() => redirectAfterPrint(), 30000);

    window.print();
  }

  simplePrint(): void {
    window.print();
  }

  simplePrintAndWait(timeoutMs = 30000): Promise<void> {
    return new Promise(resolve => {
      let finished = false;
      const printMedia = typeof window.matchMedia === 'function' ? window.matchMedia('print') : null;

      const finish = () => {
        if (finished) {
          return;
        }

        finished = true;
        cleanup();
        resolve();
      };

      const onAfterPrint = () => finish();

      const onVisibilityChange = () => {
        if (!document.hidden) {
          window.setTimeout(() => finish(), 150);
        }
      };

      const onPrintStateChange = (event: MediaQueryListEvent) => {
        if (!event.matches) {
          finish();
        }
      };

      const cleanup = () => {
        window.removeEventListener('afterprint', onAfterPrint);
        document.removeEventListener('visibilitychange', onVisibilityChange);

        if (printMedia) {
          if (typeof printMedia.removeEventListener === 'function') {
            printMedia.removeEventListener('change', onPrintStateChange);
          } else if (typeof printMedia.removeListener === 'function') {
            printMedia.removeListener(onPrintStateChange);
          }
        }
      };

      window.addEventListener('afterprint', onAfterPrint, { once: true });
      document.addEventListener('visibilitychange', onVisibilityChange);

      if (printMedia) {
        if (typeof printMedia.addEventListener === 'function') {
          printMedia.addEventListener('change', onPrintStateChange);
        } else if (typeof printMedia.addListener === 'function') {
          printMedia.addListener(onPrintStateChange);
        }
      }

      window.setTimeout(() => finish(), timeoutMs);
      window.print();
    });
  }
}
