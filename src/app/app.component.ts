import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './presentation/layouts/header/header.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { RepairRealtimeService } from './core/services/repair-realtime.service';
import { ThemeService, Theme } from './core/services/theme.service';
import { User } from './core/models/user.model';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {
  currentUser$: Observable<User | null>;
  currentTheme$: Observable<Theme>;
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private repairRealtimeService: RepairRealtimeService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.currentTheme$ = this.themeService.theme$;
  }

  ngOnInit(): void {
    this.currentTheme$.pipe(takeUntil(this.destroy$)).subscribe(theme => {
      this.isDarkMode = theme === 'dark';});

    this.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      const token = this.authService.getAccessToken();

      if (user && token) {
        this.repairRealtimeService.connect(token);
      } else {
        this.repairRealtimeService.disconnect();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
  }
}
