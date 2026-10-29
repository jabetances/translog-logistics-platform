import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NotificationService } from '../core/notification.service';
import { trimmedMinLength, trimmedRequired } from '../core/form-validators';
import { passwordPolicyError, passwordRules } from '../core/password-policy';

const acceptablePassword: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value : '';
  if (!value) return null;
  const message = passwordPolicyError(value);
  return message ? { passwordPolicy: message } : null;
};

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatSnackBarModule],
  providers: [NotificationService],
  template: `<section class="card">
    <p class="eyebrow">GESTIÓN DE ACCESOS</p>
    <h1>
      {{
        passwordChangeRequired()
          ? 'Cambia tu contraseña'
          : editing
            ? 'Editar usuario'
            : 'Registrar usuario'
      }}
    </h1>
    @if (passwordChangeRequired()) {
      <p class="password-warning" role="alert">
        Esta contraseña temporal es insegura. Debes cambiarla antes de usar TransLog.
      </p>
    }
    @if (loading()) {
      <p>Cargando usuario…</p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label for="user-full-name">Nombre completo</label>
          <input
            id="user-full-name"
            formControlName="fullName"
            autocomplete="name"
            maxlength="120"
            [readonly]="passwordChangeRequired()"
            (blur)="trimFullName()"
            [attr.aria-invalid]="
              form.controls.fullName.invalid &&
              (form.controls.fullName.touched || form.controls.fullName.dirty)
            "
            aria-describedby="user-full-name-hint"
          />
          <small id="user-full-name-hint" class="hint">Obligatorio · 2–120 caracteres.</small>
          @if (form.controls.fullName.touched || form.controls.fullName.dirty) {
            @if (form.controls.fullName.hasError('required')) {
              <small class="field-error" role="alert">Escribe el nombre completo.</small>
            } @else if (form.controls.fullName.hasError('minlength')) {
              <small class="field-error" role="alert">Debe tener al menos 2 caracteres.</small>
            } @else if (form.controls.fullName.hasError('maxlength')) {
              <small class="field-error" role="alert">No puede superar 120 caracteres.</small>
            }
          }
        </div>
        <div class="field">
          <label for="user-email">Correo electrónico</label>
          <input
            id="user-email"
            type="email"
            formControlName="email"
            autocomplete="email"
            maxlength="254"
            [readonly]="passwordChangeRequired()"
            (blur)="normalizeEmail()"
            [attr.aria-invalid]="
              form.controls.email.invalid &&
              (form.controls.email.touched || form.controls.email.dirty)
            "
            aria-describedby="user-email-hint"
          />
          <small id="user-email-hint" class="hint"
            >Obligatorio · ejemplo: nombre@empresa.com.</small
          >
          @if (form.controls.email.touched || form.controls.email.dirty) {
            @if (form.controls.email.hasError('required')) {
              <small class="field-error" role="alert">Escribe el correo electrónico.</small>
            } @else if (form.controls.email.hasError('email')) {
              <small class="field-error" role="alert">Revisa el formato del correo.</small>
            } @else if (form.controls.email.hasError('maxlength')) {
              <small class="field-error" role="alert">No puede superar 254 caracteres.</small>
            }
          }
        </div>
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
                minlength="12"
                maxlength="72"
                [attr.aria-invalid]="
                  form.controls.password.invalid &&
                  (form.controls.password.touched || form.controls.password.dirty)
                "
                aria-describedby="password-guidance password-policy-rules"
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
            <small id="password-guidance" class="hint">
              Elige una frase larga y exclusiva. No hace falta añadir símbolos por obligación ni
              reutilizar la anterior.
            </small>
            <ul
              id="password-policy-rules"
              class="password-rules"
              aria-label="Requisitos de la contraseña"
            >
              @for (rule of passwordRequirements(); track rule.id) {
                <li [class.met]="rule.valid">
                  <span aria-hidden="true">{{ rule.valid ? '✓' : '○' }}</span
                  >{{ rule.label }}
                </li>
              }
            </ul>
            @if (form.controls.password.touched || form.controls.password.dirty) {
              @if (form.controls.password.hasError('required')) {
                <small class="field-error" role="alert">Escribe una contraseña nueva.</small>
              } @else if (passwordError()) {
                <small class="field-error" role="alert">{{ passwordError() }}</small>
              }
            }
          </div>
          <div class="password-field">
            <label for="account-confirm-password">Confirmar contraseña</label>
            <div class="password-control">
              <input
                id="account-confirm-password"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                autocomplete="new-password"
                minlength="12"
                maxlength="72"
                [attr.aria-invalid]="
                  form.controls.confirmPassword.invalid &&
                  (form.controls.confirmPassword.touched || form.controls.confirmPassword.dirty)
                "
                aria-describedby="confirm-password-hint"
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
            <small id="confirm-password-hint" class="hint"
              >Vuelve a escribir exactamente la contraseña nueva.</small
            >
            @if (form.controls.confirmPassword.touched || form.controls.confirmPassword.dirty) {
              @if (form.controls.confirmPassword.hasError('required')) {
                <small id="confirm-password-error" class="field-error" role="alert">
                  Confirma la contraseña.
                </small>
              } @else if (form.controls.confirmPassword.hasError('maxlength')) {
                <small class="field-error" role="alert">No superes 72 caracteres.</small>
              } @else if (passwordsMismatch()) {
                <small class="field-error" role="alert">Las contraseñas no coinciden.</small>
              }
            }
          </div>
        }
        @if (editing && changePassword() && !passwordChangeRequired()) {
          <button type="button" class="secondary" (click)="cancelPasswordChange()">
            Cancelar cambio de contraseña
          </button>
        }
        <label
          >Rol<select
            formControlName="role"
            [disabled]="(editing && ownAccount) || passwordChangeRequired()"
          >
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
            {{
              busy()
                ? 'Guardando…'
                : passwordChangeRequired()
                  ? 'Cambiar contraseña y continuar'
                  : editing
                    ? 'Guardar cambios'
                    : 'Registrar'
            }}
          </button>
          @if (!passwordChangeRequired()) {
            <button type="button" class="secondary" [disabled]="busy()" (click)="goBack()">
              Volver a usuarios
            </button>
          }
        </div>
      </form>
    }
  </section>`,
  styles: [
    ':host{display:block;max-width:580px;margin:40px auto;padding:0 20px}.card{background:white;padding:30px}form{display:grid;gap:14px}.field,label{display:grid;gap:6px}input,select{padding:10px;border:1px solid #d6e1e4;font:inherit}.field input[aria-invalid="true"],.password-control input[aria-invalid="true"]{border-color:#b42318}.hint{color:#64777e;font-size:12px}.password-rules{display:grid;gap:5px;margin:0;padding:0;list-style:none;color:#64777e;font-size:12px}.password-rules li{display:flex;gap:7px;align-items:flex-start}.password-rules li.met{color:#087e8b;font-weight:600}.password-rules li span{width:14px;flex:0 0 14px}.password-field{display:grid;gap:6px}.password-control{position:relative;display:flex;align-items:center}.password-control input{width:100%;padding-right:46px}.password-toggle{position:absolute;right:4px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:36px;height:36px;padding:0;border:0;background:transparent;color:#64777e;cursor:pointer}.password-toggle svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.password-toggle:focus-visible{outline:2px solid #087e8b;outline-offset:1px}.password-warning{margin:0;padding:12px 14px;background:#fff0f0;border:1px solid #b42318;color:#b42318;font-weight:700}.field-error,.error{color:#b42318}.success{color:#087e8b}.buttons{display:flex;gap:10px;flex-wrap:wrap}.secondary{background:white;color:#18313a;border:1px solid #d6e1e4;padding:11px;font:inherit;cursor:pointer}.secondary:disabled{opacity:.55;cursor:not-allowed}button[mat-flat-button]{background:#087e8b;color:white;padding:11px;border:0;font-weight:700}',
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
  readonly passwordChangeRequired = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly editing = !!this.id;
  ownAccount = false;
  readonly form = this.fb.nonNullable.group({
    fullName: [
      '',
      [Validators.required, trimmedRequired, trimmedMinLength(2), Validators.maxLength(120)],
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [acceptablePassword]],
    confirmPassword: ['', [Validators.maxLength(72)]],
    role: ['OPERATOR' as 'OPERATOR' | 'SUPERVISOR', Validators.required],
  });
  constructor() {
    if (!this.editing) {
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.confirmPassword.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
      this.form.controls.confirmPassword.updateValueAndValidity();
    } else {
      const current = this.auth.user();
      if (current?.id === this.id && current.mustChangePassword === true) {
        this.passwordChangeRequired.set(true);
        this.changePassword.set(true);
        this.ownAccount = true;
        this.form.patchValue({
          fullName: current.fullName,
          email: current.email,
          role: current.role,
        });
        this.form.controls.password.addValidators(Validators.required);
        this.form.controls.confirmPassword.addValidators(Validators.required);
        this.form.controls.password.updateValueAndValidity();
        this.form.controls.confirmPassword.updateValueAndValidity();
        return;
      }
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
  passwordRequirements() {
    return passwordRules(this.form.controls.password.value);
  }
  passwordError() {
    const value = this.form.controls.password.value;
    return value ? passwordPolicyError(value) : null;
  }
  trimFullName() {
    this.form.controls.fullName.setValue(this.form.controls.fullName.value.trim());
  }
  normalizeEmail() {
    this.form.controls.email.setValue(this.form.controls.email.value.trim().toLowerCase());
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
    this.form.controls.password.addValidators(Validators.required);
    this.form.controls.confirmPassword.addValidators(Validators.required);
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.confirmPassword.updateValueAndValidity();
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
    this.changePassword.set(true);
  }
  cancelPasswordChange() {
    this.form.controls.password.removeValidators(Validators.required);
    this.form.controls.confirmPassword.removeValidators(Validators.required);
    this.form.controls.password.reset('');
    this.form.controls.confirmPassword.reset('');
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.confirmPassword.updateValueAndValidity();
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
      this.error.set('Revisa los campos marcados antes de guardar.');
      return;
    }
    if (
      this.editing &&
      v.password &&
      !this.passwordChangeRequired() &&
      !window.confirm('¿Confirmas cambiar la contraseña de ' + v.fullName + '?')
    )
      return;
    this.busy.set(true);
    this.done.set(false);
    this.error.set('');
    if (this.editing && this.passwordChangeRequired()) {
      this.auth.updateUser(this.id!, { password: v.password }).subscribe({
        next: () => {
          this.busy.set(false);
          this.notifications.showSuccess('Contraseña cambiada. Ya puedes continuar.');
          void this.router.navigate(['/shipments']);
        },
        error: (e) => this.fail(e),
      });
      return;
    }
    if (this.editing) {
      const payload: {
        fullName: string;
        email: string;
        role?: 'OPERATOR' | 'SUPERVISOR';
        password?: string;
      } = { fullName: v.fullName.trim(), email: v.email.trim().toLowerCase() };
      if (!this.ownAccount) payload.role = v.role;
      if (v.password) payload.password = v.password;
      this.auth.updateUser(this.id!, payload).subscribe({
        next: () => {
          this.cancelPasswordChange();
          this.busy.set(false);
          this.notifications.showSuccess('Usuario editado.');
          void this.router.navigate(['/users']);
        },
        error: (e) => this.fail(e),
      });
    } else
      this.auth
        .register({
          fullName: v.fullName.trim(),
          email: v.email.trim().toLowerCase(),
          role: v.role,
          password: v.password,
        })
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
