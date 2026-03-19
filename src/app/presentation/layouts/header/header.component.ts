import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User, UserRoleCode } from '../../../core/models/user.model';

interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  roles: UserRoleCode[];
  children?: MenuItem[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnChanges {
  @Input() currentUser: User | null = null;
  @Input() isDarkMode = false;
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  isMenuOpen = false;
  openDropdown: string | null = null;
  filteredMenuItems: MenuItem[] = [];

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊', roles: [UserRoleCode.SUPERADMIN, UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] },
    { 
      label: 'Catálogos', 
      icon: '📚', 
      roles: [UserRoleCode.SUPERADMIN, UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST],
      children: [
        { label: 'Usuarios', route: '/users', icon: '👥', roles: [UserRoleCode.ADMIN] },
        { label: 'Clientes', route: '/customers', icon: '👤', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] },
        { label: 'Roles', route: '/roles', icon: '🎭', roles: [UserRoleCode.ADMIN] },
        { label: 'Tipos de compostura', route: '/repair-types', icon: '📋', roles: [UserRoleCode.ADMIN] },
        { label: 'Sucursales', route: '/stores', icon: '🏪', roles: [UserRoleCode.SUPERADMIN] }
      ]
    },
    { label: 'Composturas', route: '/repairs', icon: '🧵', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST, UserRoleCode.SEAMSTRESS, UserRoleCode.HEADSEWING] },
    { label: 'Nuevo Servicio', route: '/repairs/new', icon: '➕', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] },
    { label: 'Reportes', route: '/reports', icon: '📈', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUser']) {
      this.updateFilteredMenuItems();
    }
  }

  private updateFilteredMenuItems(): void {
    if (!this.currentUser) {
      this.filteredMenuItems = [];
      return;
    }
    
    this.filteredMenuItems = this.menuItems.filter(item => {
      // Check if user has access to the parent item
      const hasAccess = item.roles.includes(this.currentUser!.role.code as UserRoleCode);
      
      // If item has children, filter them too
      if (hasAccess && item.children) {
        const filteredChildren = item.children.filter(child => 
          child.roles.includes(this.currentUser!.role.code as UserRoleCode)
        );
        // Only show parent if it has accessible children
        return filteredChildren.length > 0;
      }
      
      return hasAccess;
    }).map(item => {
      // Filter children based on user role
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => 
            child.roles.includes(this.currentUser!.role.code as UserRoleCode)
          )
        };
      }

      return item;
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleDropdown(label: string): void {
    this.openDropdown = this.openDropdown === label ? null : label;
  }

  isDropdownOpen(label: string): boolean {
    return this.openDropdown === label;
  }

  onToggleTheme(): void {
    this.toggleTheme.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
