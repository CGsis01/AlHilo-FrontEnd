import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })

export class FingerprintService {
  private devicesModule: any;
  private reader!: any;
  private fingerprintDetected$ = new Subject<string>();
  private deviceStatus$ = new Subject<'connected' | 'disconnected'>();
  private captureActive = false;

  private captureResolve: ((value: string) => void) | null = null;
  private captureReject: ((reason?: any) => void) | null = null;

  private initializationPromise?: Promise<void>
  private activeConsumer: string | null = null;

  constructor(private ngZone: NgZone) {}

  async initialize(): Promise<void> {
    try {
      if (this.reader) {
        return;
      }

      if (this.initializationPromise) {
        return this.initializationPromise;
      }

      this.initializationPromise = (async () => {
        this.devicesModule = await import('@digitalpersona/devices');
        this.reader = new this.devicesModule.FingerprintReader();
        this.registerEvents();
      })();

      return this.initializationPromise;
    } catch (error) {
      console.error('INITIALIZE ERROR', error);

      throw error;
    }
  }

  async stopCapture(): Promise<void> {
    this.captureActive = false;
    
    if (this.captureReject) {
      this.captureReject(new Error('Capture cancelled'));

      this.captureReject = null;
      this.captureResolve = null;
    }
    
    if (!this.reader) {
      return;
    }

    return this.reader.stopAcquisition().catch(() => undefined);
  }

  async captureOnePng(): Promise<string> {
    await this.initialize();

    return new Promise(async (resolve, reject) => {
      this.captureResolve = resolve;
      this.captureReject = reject;

      const onSample = async (event: any) => {
        try {
          const sample = this.extractFingerprintSample(event);

          await this.reader.stopAcquisition();

          this.reader.off('SamplesAcquired', onSample);

          if (!sample) {
            reject(new Error('No se obtuvo la huella'));
            
            return;
          }

          this.captureResolve = null;
          this.captureReject = null;

          resolve(sample);
        } catch (e) {
          this.captureResolve = null;
          this.captureReject = null;

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

  onDeviceStatus(): Observable<'connected' | 'disconnected'> {
    return this.deviceStatus$.asObservable();
  }

  public acquire(consumer: string): boolean {
    if (this.activeConsumer && this.activeConsumer !== consumer) {
      return false;
    }

    this.activeConsumer = consumer;

    return true;
  }

  public release(consumer: string): void {
    if (this.activeConsumer === consumer) {
      this.activeConsumer = null;
    }
  }

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
