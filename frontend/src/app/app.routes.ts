import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { supervisorGuard } from './core/supervisor.guard';
export const routes: Routes = [
 {path:'login',loadComponent:()=>import('./pages/login.component').then(m=>m.LoginComponent)},
 {path:'tracking',loadComponent:()=>import('./pages/tracking.component').then(m=>m.TrackingComponent)},
 {path:'users/new',canActivate:[authGuard,supervisorGuard],loadComponent:()=>import('./pages/register-user.component').then(m=>m.RegisterUserComponent)},
 {path:'shipments',canActivate:[authGuard],loadComponent:()=>import('./pages/shipments.component').then(m=>m.ShipmentsComponent)},
 {path:'shipments/:id',canActivate:[authGuard],loadComponent:()=>import('./pages/shipment-detail.component').then(m=>m.ShipmentDetailComponent)},
 {path:'',pathMatch:'full',redirectTo:'shipments'}, {path:'**',redirectTo:'shipments'}
];
