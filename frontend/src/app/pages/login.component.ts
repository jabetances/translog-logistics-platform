import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  template: `<section class="card narrow">
    <p class="eyebrow">ACCESO DE OPERADORES</p>
    <h1>Iniciar sesión</h1>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label
        >Correo electrónico<input
          type="email"
          formControlName="email"
          autocomplete="username"
        /><small class="hint">Obligatorio · ejemplo: nombre@empresa.com.</small>
        @if (form.controls.email.touched || form.controls.email.dirty) {
          @if (form.controls.email.hasError('required')) {
            <small class="field-error">Escribe el correo electrónico.</small>
          } @else if (form.controls.email.hasError('email')) {
            <small class="field-error">Revisa el formato del correo.</small>
          }
        }
      </label>
      <label
        >Contraseña<input
          type="password"
          formControlName="password"
          autocomplete="current-password"
        /><small class="hint">Obligatoria.</small>
        @if (form.controls.password.touched && form.controls.password.hasError('required')) {
          <small class="field-error">Escribe la contraseña.</small>
        }
      </label>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <button mat-flat-button color="primary" [disabled]="form.invalid || loading()">
        {{ loading() ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>
    <a routerLink="/tracking">Consultar envío sin iniciar sesión</a>
  </section>`,
  styles: [
    `
      :host {
        display: block;
        padding: 48px 20px;
      }
      .narrow {
        max-width: 420px;
        margin: auto;
      }
      .card {
        background: white;
        padding: 32px;
        border-radius: 0;
        box-shadow: none;
      }
      label {
        display: grid;
        gap: 6px;
        margin: 16px 0;
        font-weight: 600;
      }
      input {
        padding: 12px;
        border: 1px solid #d6e1e4;
        border-radius: 0;
        font: inherit;
      }
      .hint {
        color: #64777e;
        font-size: 12px;
        font-weight: 400;
      }
      .field-error {
        color: #b42318;
        font-size: 12px;
        font-weight: 400;
      }
      button {
        width: 100%;
        padding: 12px;
        background: #087e8b;
        color: #fff;
        border: 0;
        border-radius: 0;
        font-weight: 700;
        cursor: pointer;
      }
      .error {
        color: #b42318;
      }
      a {
        display: block;
        margin-top: 20px;
        color: #087e8b;
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue().email, this.form.getRawValue().password).subscribe({
      next: () => this.router.navigateByUrl('/shipments'),
      error: (e) => {
        const message = e.error?.message ?? 'No se pudo iniciar sesión';
        this.error.set(message);
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        this.loading.set(false);
      },
    });
  }
}
