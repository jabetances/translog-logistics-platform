import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatSnackBarModule],
  providers: [NotificationService],
  template: `<section class="card">
    <p class="eyebrow">GESTIÓN DE ACCESOS</p>
    <h1>{{ editing ? 'Editar usuario' : 'Registrar usuario' }}</h1>
    @if (loading()) {
      <p>Cargando usuario…</p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label
          >Nombre completo<input formControlName="fullName" autocomplete="name" maxlength="120"
        /></label>
        <label
          >Correo<input
            type="email"
            formControlName="email"
            autocomplete="username"
            maxlength="254"
        /></label>
        @if (editing && !changePassword()) {
          <button type="button" class="secondary" (click)="beginPasswordChange()">
            Cambiar contraseña
          </button>
        }
        @if (!editing || changePassword()) {
          <div class="password-field">
            <label for="account-password">Contraseña</label>
            <div class="password-control">
              <input
                id="account-password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="new-password"
                minlength="10"
                maxlength="100"
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
            <small class="hint">{{
              editing
                ? 'Escribe la nueva contraseña y confírmala; debe tener 10–100 caracteres.'
                : 'Obligatoria · 10–100 caracteres.'
            }}</small>
          </div>
          <div class="password-field">
            <label for="account-confirm-password">Confirmar contraseña</label>
            <div class="password-control">
              <input
                id="account-confirm-password"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                autocomplete="new-password"
                minlength="10"
                maxlength="100"
              />
              <button
                type="button"
                class="password-toggle"
                [attr.aria-label]="
                  showConfirmPassword() ? 'Ocultar confirmación' : 'Mostrar confirmación'
                "
                [attr.aria-pressed]="showConfirmPassword()"
                (click)="toggleConfirmPasswordVisibility()"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            @if (
              (form.controls.password.touched ||
                form.controls.password.dirty ||
                form.controls.confirmPassword.touched ||
                form.controls.confirmPassword.dirty) &&
              passwordsMismatch()
            ) {
              <small class="field-error">Las contraseñas no coinciden.</small>
            }
          </div>
        }
        @if (editing && changePassword()) {
          <button type="button" class="secondary" (click)="cancelPasswordChange()">
            Cancelar cambio de contraseña
          </button>
        }
        <label
          >Rol<select formControlName="role" [disabled]="editing && ownAccount">
            <option value="OPERATOR">Operador</option>
            <option value="SUPERVISOR">Supervisor</option></select
          ><small class="hint">El supervisor puede gestionar usuarios.</small></label
        >
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        @if (done()) {
          <p class="success" role="status">
            {{ editing ? 'Cambios guardados.' : 'Usuario registrado.' }}
          </p>
        }
        <div class="buttons">
          <button
            mat-flat-button
            color="primary"
            [disabled]="busy() || form.invalid || passwordsMismatch()"
          >
            {{ busy() ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar' }}
          </button>
          <button type="button" class="secondary" [disabled]="busy()" (click)="goBack()">
            Volver a usuarios
          </button>
        </div>
      </form>
    }
  </section>`,
  styles: [
    ':host{display:block;max-width:580px;margin:40px auto;padding:0 20px}.card{background:white;padding:30px}form{display:grid;gap:14px}label{display:grid;gap:6px}input,select{padding:10px;border:1px solid #d6e1e4;font:inherit}.hint{color:#64777e;font-size:12px}.password-field{display:grid;gap:6px}.password-control{position:relative;display:flex;align-items:center}.password-control input{width:100%;padding-right:46px}.password-toggle{position:absolute;right:4px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:36px;height:36px;padding:0;border:0;background:transparent;color:#64777e;cursor:pointer}.password-toggle svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.password-toggle:focus-visible{outline:2px solid #087e8b;outline-offset:1px}.field-error,.error{color:#b42318}.success{color:#087e8b}.buttons{display:flex;gap:10px;flex-wrap:wrap}.secondary{background:white;color:#18313a;border:1px solid #d6e1e4;padding:11px;font:inherit;cursor:pointer}.secondary:disabled{opacity:.55;cursor:not-allowed}button[mat-flat-button]{background:#087e8b;color:white;padding:11px;border:0;font-weight:700}',
  ],
})
export class RegisterUserComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notifications = inject(NotificationService);
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly error = signal('');
  readonly loading = signal(false);
  readonly changePassword = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly editing = !!this.id;
  ownAccount = false;
  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.minLength(10), Validators.maxLength(100)]],
    confirmPassword: ['', [Validators.minLength(10), Validators.maxLength(100)]],
    role: ['OPERATOR' as 'OPERATOR' | 'SUPERVISOR', Validators.required],
  });
  constructor() {
    if (!this.editing) {
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.confirmPassword.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
      this.form.controls.confirmPassword.updateValueAndValidity();
    } else {
      this.loading.set(true);
      this.auth.listUsers().subscribe({
        next: (rows) => {
          const u = rows.find((x) => x.id === this.id);
          if (!u) {
            this.error.set('Usuario no encontrado');
            this.loading.set(false);
            return;
          }
          this.ownAccount = this.auth.user()?.id === u.id;
          this.form.patchValue({ fullName: u.fullName, email: u.email, role: u.role });
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el usuario.');
          this.loading.set(false);
        },
      });
    }
  }
  passwordsMismatch() {
    const { password, confirmPassword } = this.form.getRawValue();
    return password !== confirmPassword;
  }
  togglePasswordVisibility() {
    this.showPassword.update((visible) => !visible);
  }
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((visible) => !visible);
  }
  beginPasswordChange() {
    this.error.set('');
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
    this.changePassword.set(true);
  }
  cancelPasswordChange() {
    this.form.controls.password.reset('');
    this.form.controls.confirmPassword.reset('');
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
    this.changePassword.set(false);
  }
  goBack() {
    this.router.navigate(['/users']);
  }
  submit() {
    const v = this.form.getRawValue();
    const hasPassword = !!v.password || !!v.confirmPassword;
    if (this.form.invalid || this.passwordsMismatch() || (!this.editing && !hasPassword)) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los datos y confirma la contraseña.');
      return;
    }
    if (
      this.editing &&
      v.password &&
      !window.confirm('¿Confirmas cambiar la contraseña de ' + v.fullName + '?')
    )
      return;
    this.busy.set(true);
    this.done.set(false);
    this.error.set('');
    if (this.editing) {
      const payload: {
        fullName: string;
        email: string;
        role?: 'OPERATOR' | 'SUPERVISOR';
        password?: string;
      } = { fullName: v.fullName, email: v.email };
      if (!this.ownAccount) payload.role = v.role;
      if (v.password) payload.password = v.password;
      this.auth.updateUser(this.id!, payload).subscribe({
        next: () => {
          this.done.set(true);
          this.cancelPasswordChange();
          this.busy.set(false);
        },
        error: (e) => this.fail(e),
      });
    } else
      this.auth
        .register({ fullName: v.fullName, email: v.email, role: v.role, password: v.password })
        .subscribe({
          next: () => {
            this.done.set(true);
            this.form.controls.password.reset('');
            this.form.controls.confirmPassword.reset('');
            this.showPassword.set(false);
            this.showConfirmPassword.set(false);
            this.busy.set(false);
          },
          error: (e) => this.fail(e),
        });
  }
  private fail(e: { error?: { message?: string } }) {
    const message = e.error?.message ?? 'No se pudo guardar el usuario';
    this.error.set(message);
    this.notifications.showError(message);
    this.busy.set(false);
  }
}
