import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User, UserRoleCode } from '../../../core/models/user.model';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  roles: UserRoleCode[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent {
  @Input() currentUser: User | null = null;
  @Input() isDarkMode = false;
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  isMenuOpen = false;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] },
    { label: 'Composturas', route: '/repairs', icon: '🧵', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST, UserRoleCode.SEAMSTRESS] },
    { label: 'Nueva compostura', route: '/repairs/new', icon: '➕', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] },
    { label: 'Usuarios', route: '/users', icon: '👥', roles: [UserRoleCode.ADMIN] },
    { label: 'Clientes', route: '/customers', icon: '👤', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] },
    { label: 'Roles', route: '/roles', icon: '🎭', roles: [UserRoleCode.ADMIN] },
    { label: 'Tipos de compostura', route: '/repair-types', icon: '📋', roles: [UserRoleCode.ADMIN] },
    { label: 'Reportes', route: '/reports', icon: '📈', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] }
  ];

  get filteredMenuItems(): MenuItem[] {
    if (!this.currentUser) return [];
    
    return this.menuItems.filter(item => item.roles.includes(this.currentUser!.role.code as UserRoleCode));
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onToggleTheme(): void {
    this.toggleTheme.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
