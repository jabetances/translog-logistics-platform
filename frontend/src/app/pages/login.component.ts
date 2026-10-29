import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NotificationService } from '../core/notification.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  providers: [NotificationService],
  template: `<section class="card narrow">
    <p class="eyebrow">ACCESO DE OPERADORES</p>
    <h1>Iniciar sesión</h1>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label
        >Correo electrónico<input
          type="email"
          formControlName="email"
          autocomplete="email"
          maxlength="254"
          (blur)="normalizeEmail()"
          [attr.aria-invalid]="
            form.controls.email.invalid &&
            (form.controls.email.touched || form.controls.email.dirty)
          "
          aria-describedby="login-email-hint"
        /><small id="login-email-hint" class="hint"
          >Obligatorio · ejemplo: nombre@empresa.com.</small
        >
        @if (form.controls.email.touched || form.controls.email.dirty) {
          @if (form.controls.email.hasError('required')) {
            <small class="field-error" role="alert">Escribe el correo electrónico.</small>
          } @else if (form.controls.email.hasError('email')) {
            <small class="field-error" role="alert">Revisa el formato del correo.</small>
          } @else if (form.controls.email.hasError('maxlength')) {
            <small class="field-error" role="alert"
              >El correo no puede superar 254 caracteres.</small
            >
          }
        }
      </label>
      <div class="password-field">
        <label for="login-password">Contraseña</label>
        <div class="password-control">
          <input
            id="login-password"
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="current-password"
            [attr.aria-invalid]="form.controls.password.invalid && form.controls.password.touched"
            aria-describedby="login-password-hint"
          />
          <button
            type="button"
            class="password-toggle"
            [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            [attr.aria-pressed]="showPassword()"
            (click)="togglePasswordVisibility()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
        <small id="login-password-hint" class="hint"
          >Escribe la contraseña que usas para acceder.</small
        >
        @if (form.controls.password.touched && form.controls.password.hasError('required')) {
          <small class="field-error" role="alert">Escribe la contraseña.</small>
        }
      </div>
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
      .password-field {
        display: grid;
        gap: 6px;
        margin: 16px 0;
      }
      .password-field label {
        margin: 0;
      }
      .password-control {
        position: relative;
        display: flex;
        align-items: center;
      }
      .password-control input {
        width: 100%;
        padding-right: 46px;
      }
      .password-toggle {
        position: absolute;
        top: 50%;
        right: 4px;
        display: grid;
        width: 36px;
        height: 36px;
        padding: 0;
        place-items: center;
        transform: translateY(-50%);
        border: 0;
        background: transparent;
        color: #64777e;
        cursor: pointer;
      }
      .password-toggle svg {
        width: 20px;
        height: 20px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .password-toggle:focus-visible {
        outline: 2px solid #087e8b;
        outline-offset: 1px;
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
  private notifications = inject(NotificationService);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', Validators.required],
  });
  togglePasswordVisibility() {
    this.showPassword.update((visible) => !visible);
  }
  normalizeEmail() {
    this.form.controls.email.setValue(this.form.controls.email.value.trim().toLowerCase());
  }
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth
      .login(this.form.getRawValue().email.trim().toLowerCase(), this.form.getRawValue().password)
      .subscribe({
        next: () => this.router.navigateByUrl('/shipments'),
        error: (e) => {
          const message = e.error?.message ?? 'No se pudo iniciar sesión';
          this.error.set(message);
          this.notifications.showError(message);
          this.loading.set(false);
        },
      });
  }
}
