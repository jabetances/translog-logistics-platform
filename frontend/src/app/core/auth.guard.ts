import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
export const authGuard: CanActivateFn = () => localStorage.getItem('translog_token') ? true : inject(Router).createUrlTree(['/login']);
