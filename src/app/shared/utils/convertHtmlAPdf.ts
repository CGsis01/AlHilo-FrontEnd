import {Injectable} from '@angular/core';
import html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root'
})
export class ConvertHtmlAPdf {
    async convertirHtmlAPdf(elementId: string, fileName: string): Promise<Blob> {
    const elemento = document.getElementById(elementId) as HTMLElement;
    
    if (!elemento) {
      throw new Error(`No se encontró el elemento #${elementId} en el DOM`);
    }

    const patchedCSSMap = new Map<string, string>();
    await Promise.all(
      Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(async link => {
        try {
          const css = await fetch(link.href).then(r => r.text());
          patchedCSSMap.set(link.href, css.replace(/oklch\([^)]*\)/g, '#000000'));
        } catch {}
      })
    );

    const origEls = [elemento, ...Array.from(elemento.querySelectorAll<HTMLElement>('*'))];
    const computedStyles = origEls.map(el => {
      const cs = window.getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, borderColor: cs.borderColor };
    });

    const opciones = {
      margin: 20,
      filename: `${fileName}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
          clonedDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach(link => {
            const patched = patchedCSSMap.get(link.href);
            if (patched) {
              const style = clonedDoc.createElement('style');
              style.textContent = patched;
              link.replaceWith(style);
            }
          });

          const clonedEls = [clonedEl, ...Array.from(clonedEl.querySelectorAll<HTMLElement>('*'))];
          clonedEls.forEach((el, i) => {
            const s = computedStyles[i];
            if (s) {
              el.style.backgroundColor = s.bg;
              el.style.color = s.color;
              el.style.borderColor = s.borderColor;
            }
          });
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }as const;

    const blob = await html2pdf().set(opciones).from(elemento).outputPdf('blob').then();
    return blob;
  }
}