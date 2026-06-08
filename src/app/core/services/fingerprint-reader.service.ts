import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
// import { FingerprintReader, QualityCode, QualityReported, SampleFormat, SamplesAcquired } from '@digitalpersona/devices';

@Injectable({ providedIn: 'root' })

export class FingerprintService {
  // private reader!: FingerprintReader;
  private devicesModule: any;
  private reader!: any;
  private fingerprintDetected$ = new Subject<string>();
  private currentQuality$ = new Subject<string>();
  private deviceStatus$ = new Subject<'connected' | 'disconnected'>();
  private captureActive = false;

  private captureResolve: ((value: string) => void) | null = null;

  constructor(private ngZone: NgZone) {}

  async initialize(): Promise<void> {
    try {
      console.log('IMPORTANDO DIGITALPERSONA');

      if (this.reader) {
        console.log('READER YA EXISTE');
        return;
      }

      this.devicesModule = await import('@digitalpersona/devices');

      console.log('IMPORT OK');

      this.reader = new this.devicesModule.FingerprintReader();

      console.log('READER CREATED');

      this.registerEvents();
    } catch (error) {
      console.error('INITIALIZE ERROR', error);

      throw error;
    }
  }

  // private createReader(): void {
  //   this.reader = new FingerprintReader();
  //   this.registerEvents();
  // }

  private registerEvents(): void {
    if (!this.reader) {
      return;
    }

    this.reader.on('DeviceConnected', () => {
      this.ngZone.run(() => { this.deviceStatus$.next('connected'); });
    });

    this.reader.on('DeviceDisconnected', () => {
      this.ngZone.run(() => { this.deviceStatus$.next('disconnected'); });
    });

    this.reader.on('AcquisitionStarted', () => {
      this.ngZone.run(() => { this.captureActive = true; });
    });

    this.reader.on('AcquisitionStopped', () => {
      this.ngZone.run(() => { this.captureActive = false; });
    });

    this.reader.on('QualityReported', (event: any) => {
      this.ngZone.run(() => {
        const quality = event.quality;
        
        switch (quality) {
          case this.devicesModule.QualityCode.Good:
            this.currentQuality$.next('Buena');
            break;
          case this.devicesModule.QualityCode.TooDark:
            this.currentQuality$.next('Mala: Imagen demasiado oscura');
            break;
          case this.devicesModule.QualityCode.TooLight:
            this.currentQuality$.next('Mala: Imagen demasiado clara');
            break;
          case this.devicesModule.QualityCode.TooNoisy:
            this.currentQuality$.next('Mala: Imagen con mucho ruido');
            break;
          case this.devicesModule.QualityCode.TooSmall:
            this.currentQuality$.next('Mala: Área de la huella muy pequeña');
            break;
          default:
            this.currentQuality$.next('Mala: Calidad deficiente, intente de nuevo');
            break;
        }
      });
    });

    this.reader.on('SamplesAcquired', (event: any) => {
      this.ngZone.run(() => {
        const fingerprintData = this.extractFingerprintSample(event);

        if (!fingerprintData) {
          return;
        }

        this.fingerprintDetected$.next(fingerprintData);

        if (this.captureResolve) {
          this.captureResolve(fingerprintData);
          this.captureResolve = null;
        }
      });
    });
  }

  async startCapture(): Promise<void> {
    if (!this.reader) {
      await this.initialize();
    }

    this.resetWebSdkSessionCache();

    return this.beginCapture();
  }

  async stopCapture(): Promise<void> {
    this.captureActive = false;
    this.captureResolve = null;

    if (!this.reader) {
      await this.initialize();
    }

    return this.reader.stopAcquisition().catch(() => undefined);
  }

  onFingerprintDetected(): Observable<string> {
    return this.fingerprintDetected$.asObservable();
  }

  onSampleCaptured(): Observable<string> {
    return this.onFingerprintDetected();
  }

  onQualityReported(): Observable<string> {
    return this.currentQuality$.asObservable();
  }

  onDeviceStatus(): Observable<'connected' | 'disconnected'> {
    return this.deviceStatus$.asObservable();
  }

  async captureOnePng(): Promise<string> {
    console.log('ANTES DE INITIALIZE');

    await this.initialize();

    console.log('DESPUES DE INITIALIZE', this.reader);

    return new Promise(async (resolve, reject) => {
      const onSample = async (event: any) => {
        try {
          const sample = this.extractFingerprintSample(event);

          await this.reader.stopAcquisition();

          this.reader.off('SamplesAcquired', onSample);

          if (!sample) {
            reject(new Error('No se obtuvo la huella'));
            
            return;
          }

          resolve(sample);
        } catch (e) {
          reject(e);
        }
      };

      this.reader.on('SamplesAcquired', onSample);

      try {        
        await this.reader.startAcquisition(this.devicesModule.SampleFormat.PngImage);
      } catch (e) {
        this.reader.off('SamplesAcquired', onSample);
        reject(e);
      }
    });
  }

  async captureFourPngs(): Promise<string[]> {
    if (!this.reader) {
      await this.initialize();
    }

    const samples: string[] = [];

    for (let i = 0; i < 4; i++) {
      const sample = await this.captureOnePng();
      
      samples.push(sample);
      
      await this.stopCapture();
    }

    return samples;
  }

  stopListening(): Promise<void> {
    return this.stopCapture();
  }

  private async beginCapture(): Promise<void> {
    if (this.captureActive) {
      return;
    }

    try {
      await this.reader.startAcquisition(this.devicesModule.SampleFormat.PngImage);
      
      this.captureActive = true;
    } catch (error) {
      throw new Error(this.describeSdkCaptureError(error));
    }
  }

  private resetWebSdkSessionCache(): void {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.removeItem('websdk');
    sessionStorage.removeItem('websdk.sessionId');
  }

  private describeSdkCaptureError(error: unknown): string {
    const raw = this.getErrorText(error).toLowerCase();

    if (raw.includes('err_connection_refused') || raw.includes('communication failure') || raw.includes('connection refused')) {
      return 'No hay comunicacion con el canal local de DigitalPersona (WebSdk en 127.0.0.1:50282). Inicia o reinicia el DigitalPersona WebSdk Service y vuelve a intentar.';
    }

    return this.getErrorText(error) || 'No se pudo iniciar la captura de huella.';
  }

  private getErrorText(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (error && typeof error === 'object') {
      const asRecord = error as Record<string, unknown>;
      const message = asRecord['message'];

      if (typeof message === 'string') {
        return message;
      }
    }

    return String(error ?? '');
  }

  private extractFingerprintSample(event: any): string | null {
    if (!event.samples?.length) {
      return null;
    }

    const sample = event.samples[0];

    // PngImage
    if (typeof sample === 'string') {
      return sample;
    }

    // Intermediate (compatibilidad)
    const data = (sample as any)?.Data;

    if (typeof data === 'string') {
      return data;
    }

    return null;
  }
}
