import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRoleCode } from './core/models/user.model';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./presentation/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./presentation/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'repairs',
    loadComponent: () => import('./presentation/pages/repairs/repairs.component').then(m => m.RepairsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'repairs/new',
    loadComponent: () => import('./presentation/pages/repair-form/repair-form.component').then(m => m.RepairFormComponent),
    canActivate: [authGuard, roleGuard([UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST])]
  },
  {
    path: 'repairs/:id',
    loadComponent: () => import('./presentation/pages/repair-detail/repair-detail.component').then(m => m.RepairDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./presentation/pages/users/users.component').then(m => m.UsersComponent),
    canActivate: [authGuard, roleGuard([UserRoleCode.ADMIN])]
  },
  {
    path: 'reports',
    loadComponent: () => import('./presentation/pages/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard, roleGuard([UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST])]
  },
  {
    path: 'roles',
    loadComponent: () => import('./presentation/pages/roles/roles.component').then(m => m.RolesComponent),
    canActivate: [authGuard, roleGuard([UserRoleCode.ADMIN])]
  },
  {
    path: 'stores',
    loadComponent: () => import('./presentation/pages/stores/stores.component').then(m => m.StoresComponent),
    canActivate: [authGuard, roleGuard([UserRoleCode.SUPERADMIN])]
  },
  {
    path: 'repair-types',
    loadComponent: () => import('./presentation/pages/repair-types/repair-types.component').then(m => m.RepairTypesComponent),
    canActivate: [authGuard, roleGuard([UserRoleCode.ADMIN])]
  },
  {
    path: 'customers',
    loadComponent: () => import('./presentation/pages/customers/customers.component').then(m => m.CustomersComponent),
    canActivate: [authGuard, roleGuard([UserRoleCode.ADMIN, UserRoleCode.RECEPTIONIST])]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
