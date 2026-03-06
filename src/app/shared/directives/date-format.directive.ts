import { Directive, ElementRef, forwardRef, HostListener, Renderer2 } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * DateFormatDirective
 * Wraps <input type="date"> as a ControlValueAccessor so it works with both
 * [(ngModel)] and formControlName.  Sets lang="es" so Chromium/Edge renders
 * the picker in dd/mm/yyyy.  The model value is always a yyyy-MM-dd string.
 *
 * Usage:  <input appDateFormat formControlName="myDate">
 *         <input appDateFormat [(ngModel)]="myDateStr">
 */
@Directive({
  selector: 'input[appDateFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFormatDirective),
      multi: true
    }
  ]
})

export class DateFormatDirective implements ControlValueAccessor {
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef<HTMLInputElement>, private renderer: Renderer2) {
    this.renderer.setAttribute(this.el.nativeElement, 'type', 'date');
    // Hint the browser to use dd/mm/yyyy layout (respected by Chromium & Edge)
    this.renderer.setAttribute(this.el.nativeElement, 'lang', 'es');
  }

  // ControlValueAccessor ---------------------------------------------------

  writeValue(value: string | Date | null | undefined): void {
    this.el.nativeElement.value = this.toYMD(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);
  }

  // Host listeners ---------------------------------------------------------

  @HostListener('change')
  onChanged(): void {
    this.onChange(this.el.nativeElement.value); // always yyyy-MM-dd
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  // Helpers ----------------------------------------------------------------

  /** Normalise any incoming value to yyyy-MM-dd (what <input type="date"> expects) */
  private toYMD(value: string | Date | null | undefined): string {
    if (!value) return '';
    
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? '' : value.toISOString().split('T')[0];
    }
    
    // Accept yyyy-MM-dd strings directly
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.substring(0, 10);
    
    // Try parsing anything else
    const d = new Date(value);
    
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }
}
