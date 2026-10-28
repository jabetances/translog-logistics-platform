import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }
}
