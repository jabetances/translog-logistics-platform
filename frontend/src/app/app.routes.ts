import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { supervisorGuard } from './core/supervisor.guard';
export const routes: Routes = [
  {
    path: 'login',
    title: 'TransLog — Acceso',
    loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'tracking',
    title: 'TransLog — Seguimiento',
    loadComponent: () => import('./pages/tracking.component').then((m) => m.TrackingComponent),
  },
  {
    path: 'users/new',
    title: 'TransLog — Nuevo usuario',
    canActivate: [authGuard, supervisorGuard],
    loadComponent: () =>
      import('./pages/register-user.component').then((m) => m.RegisterUserComponent),
  },
  {
    path: 'users',
    title: 'TransLog — Usuarios',
    canActivate: [authGuard, supervisorGuard],
    loadComponent: () => import('./pages/users-list.component').then((m) => m.UsersListComponent),
  },
  {
    path: 'shipments',
    title: 'TransLog — Envíos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shipments.component').then((m) => m.ShipmentsComponent),
  },
  {
    path: 'shipments/:id',
    title: 'TransLog — Detalle del envío',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/shipment-detail.component').then((m) => m.ShipmentDetailComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'shipments' },
  { path: '**', redirectTo: 'shipments' },
];
