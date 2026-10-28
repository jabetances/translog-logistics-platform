import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
export const supervisorGuard: CanActivateFn = () => {
  const router = inject(Router);
  try {
    const user = JSON.parse(localStorage.getItem('translog_user') ?? 'null') as {
      role?: string;
    } | null;
    return user?.role === 'SUPERVISOR' ? true : router.createUrlTree(['/shipments']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};
