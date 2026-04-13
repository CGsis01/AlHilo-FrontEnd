import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges, HostListener, ElementRef, signal } from '@angular/core';
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

  isMenuOpen = signal(false);
  openDropdowns: Set<string> = new Set();
  filteredMenuItems: MenuItem[] = [];

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    
    // Close dropdowns if clicked outside the header component
    if (!clickedInside && this.openDropdowns.size > 0) {
      this.openDropdowns.clear();
    }
  }

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊', roles: [UserRoleCode.SUPERADMIN, UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] },
    { 
      label: 'Catálogos', 
      icon: '📚', 
      roles: [UserRoleCode.SUPERADMIN, UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST],
      children: [
        { 
          label: 'Sistema', 
          icon: '📚', 
          roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST],
          children: [
            { label: 'Usuarios', route: '/users', icon: '👥', roles: [UserRoleCode.ADMIN] },
            { label: 'Roles', route: '/roles', icon: '🎭', roles: [UserRoleCode.ADMIN] },
            { label: 'Sucursales', route: '/stores', icon: '🏪', roles: [UserRoleCode.ADMIN] }
          ]
        },
        { 
          label: 'Reparaciones', 
          icon: '📚', 
          roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST],
          children: [
            { label: 'Clientes', route: '/customers', icon: '👤', roles: [UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST] },
            { label: 'Materiales', route: '/materials', icon: '📦', roles: [UserRoleCode.ADMIN, UserRoleCode.SUPERADMIN] },
            { label: 'Complejidades', route: '/repair-complexities', icon: '⚙️', roles: [UserRoleCode.ADMIN, UserRoleCode.SUPERADMIN] },
            { label: 'Tipos de compostura', route: '/repair-types', icon: '📋', roles: [UserRoleCode.ADMIN] },
            { label: 'Prendas', route: '/garments', icon: '👔', roles: [UserRoleCode.ADMIN, UserRoleCode.SUPERADMIN] }
          ]
        },
        { 
          label: 'SuperAdmin', 
          icon: '📚', 
          roles: [UserRoleCode.SUPERADMIN],
          children: [
            { label: 'Sucursales', route: '/stores', icon: '🏪', roles: [UserRoleCode.SUPERADMIN] }
          ]
        }
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

    this.isMenuOpen.set(false);
    this.openDropdowns.clear();
    
    this.filteredMenuItems = this.filterMenuItemsRecursively(this.menuItems);
  }

  private filterMenuItemsRecursively(items: MenuItem[]): MenuItem[] {
    return items.filter(item => {
      // Check if user has access to the item
      const hasAccess = item.roles.includes(this.currentUser!.role.code as UserRoleCode);
      
      // If item has children, recursively filter them
      if (hasAccess && item.children) {
        const filteredChildren = this.filterMenuItemsRecursively(item.children);

        // Only show parent if it has accessible children or its own route
        return filteredChildren.length > 0 || item.route;
      }
      
      return hasAccess;
    }).map(item => {
      // Recursively filter children based on user role
      if (item.children) {
        const filteredChildren = this.filterMenuItemsRecursively(item.children);

        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        };
      }

      return item;
    });
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
    this.openDropdowns.clear();
  }

  toggleDropdown(path: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.openDropdowns.has(path)) {
      this.openDropdowns.delete(path);
      
      // Close all child dropdowns when parent closes
      const childPaths = Array.from(this.openDropdowns).filter(p => p.startsWith(path + '.'));
      
      childPaths.forEach(p => this.openDropdowns.delete(p));
    } else {
      // Close sibling dropdowns at the same level
      const pathParts = path.split('.');
      const parentPath = pathParts.slice(0, -1).join('.');
      const currentLevel = pathParts.length;
      
      // Find and close all siblings (same level, same parent)
      Array.from(this.openDropdowns).forEach(openPath => {
        const openPathParts = openPath.split('.');
        const openParentPath = openPathParts.slice(0, -1).join('.');
        
        // If it's at the same level and has the same parent, close it
        if (openPathParts.length === currentLevel && openParentPath === parentPath && openPath !== path) {
          this.openDropdowns.delete(openPath);
          
          // Also close all children of the sibling
          const childPaths = Array.from(this.openDropdowns).filter(p => p.startsWith(openPath + '.'));
          childPaths.forEach(p => this.openDropdowns.delete(p));
        }
      });
      
      this.openDropdowns.add(path);
    }
  }

  isDropdownOpen(path: string): boolean {
    return this.openDropdowns.has(path);
  }

  getMenuItemPath(parentPath: string, label: string): string {
    return parentPath ? `${parentPath}.${label}` : label;
  }

  hasChildren(item: MenuItem): boolean {
    return !!item.children && item.children.length > 0;
  }

  onToggleTheme(): void {
    this.toggleTheme.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
