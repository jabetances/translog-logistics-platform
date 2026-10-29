import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  if (!auth.token) return router.createUrlTree(['/login']);

  const user = auth.user();
  if (user?.mustChangePassword === true) {
    const requiredRoute = '/users/' + user.id + '/edit';
    if (state.url.split(/[?#]/, 1)[0] !== requiredRoute)
      return router.createUrlTree(['/users', user.id, 'edit']);
  }
  return true;
};
