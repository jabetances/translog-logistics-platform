import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService, AuthUser, ManagedUser } from '../core/auth.service';

type UserSortField = 'fullName' | 'email' | 'role' | 'createdAt';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [DatePipe, RouterLink, MatSnackBarModule],
  template: `
    <section class="wrap">
      <div class="heading">
        <div>
          <p class="eyebrow">GESTIÓN DE ACCESOS</p>
          <h1>Usuarios</h1>
        </div>
        <a class="button" routerLink="/users/new">+ Nuevo usuario</a>
      </div>
      <div class="mobile-sort">
        <label
          >Ordenar por<select
            aria-label="Ordenar usuarios por"
            [value]="sortBy()"
            (change)="setSortBy($any($event.target).value)"
          >
            <option value="fullName">Nombre</option>
            <option value="email">Correo</option>
            <option value="role">Rol</option>
            <option value="createdAt">Alta</option>
          </select></label
        ><button type="button" (click)="toggleSortDirection()">
          {{ sortDirection() === 'ASC' ? 'Ascendente ↑' : 'Descendente ↓' }}
        </button>
      </div>
      @if (loading()) {
        <p>Cargando usuarios…</p>
      }
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      @if (actionError()) {
        <p class="error" role="alert">{{ actionError() }}</p>
      }
      @if (!loading() && !error()) {
        <div class="table">
          <table>
            <thead>
              <tr>
                <th [attr.aria-sort]="sortAria('fullName')">
                  <button class="sort-button" type="button" (click)="toggleSort('fullName')">
                    Nombre <span aria-hidden="true">{{ sortIndicator('fullName') }}</span>
                  </button>
                </th>
                <th [attr.aria-sort]="sortAria('email')">
                  <button class="sort-button" type="button" (click)="toggleSort('email')">
                    Correo <span aria-hidden="true">{{ sortIndicator('email') }}</span>
                  </button>
                </th>
                <th [attr.aria-sort]="sortAria('role')">
                  <button class="sort-button" type="button" (click)="toggleSort('role')">
                    Rol <span aria-hidden="true">{{ sortIndicator('role') }}</span>
                  </button>
                </th>
                <th [attr.aria-sort]="sortAria('createdAt')">
                  <button class="sort-button" type="button" (click)="toggleSort('createdAt')">
                    Alta <span aria-hidden="true">{{ sortIndicator('createdAt') }}</span>
                  </button>
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (item of sortedUsers(); track item.id) {
                <tr>
                  <td data-label="Nombre">
                    @if (editingId() === item.id) {
                      <input
                        class="edit-name"
                        aria-label="Nombre completo"
                        [value]="editName()"
                        (input)="editName.set($any($event.target).value)"
                        (keyup.enter)="saveUser(item)"
                      />
                    } @else {
                      {{ item.fullName }}
                    }
                  </td>
                  <td data-label="Correo">
                    @if (editingId() === item.id) {
                      <input
                        class="edit-email"
                        type="email"
                        aria-label="Correo del usuario"
                        maxlength="254"
                        [value]="editEmail()"
                        (input)="editEmail.set($any($event.target).value)"
                        (keyup.enter)="saveUser(item)"
                      />
                    } @else {
                      {{ item.email }}
                    }
                  </td>
                  <td data-label="Rol">
                    @if (editingId() === item.id) {
                      <select
                        class="edit-role"
                        aria-label="Rol del usuario"
                        [value]="editRole()"
                        [disabled]="auth.user()?.id === item.id"
                        (change)="editRole.set($any($event.target).value)"
                      >
                        <option value="OPERATOR">Operador</option>
                        <option value="SUPERVISOR">Supervisor</option>
                      </select>
                      @if (auth.user()?.id === item.id) {
                        <small class="role-hint">Tu propio rol no se cambia aquí.</small>
                      }
                    } @else {
                      {{ roleLabel(item.role) }}
                    }
                  </td>
                  <td data-label="Alta">{{ item.createdAt | date: 'd/M/yy, HH:mm' }}</td>
                  <td data-label="Acciones">
                    <div class="actions">
                      @if (editingId() === item.id) {
                        <button type="button" (click)="saveUser(item)" [disabled]="actionBusy()">
                          Guardar
                        </button>
                        <button type="button" (click)="cancelEdit()" [disabled]="actionBusy()">
                          Cancelar
                        </button>
                      } @else {
                        <button type="button" (click)="startEdit(item)" [disabled]="actionBusy()">
                          Editar
                        </button>
                        <button
                          class="danger"
                          type="button"
                          (click)="deleteUser(item)"
                          [disabled]="actionBusy() || auth.user()?.id === item.id"
                          [title]="
                            auth.user()?.id === item.id
                              ? 'No puedes eliminar tu propia cuenta'
                              : 'Eliminar usuario'
                          "
                        >
                          Eliminar
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5">No hay usuarios registrados.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: Inter, system-ui, sans-serif;
        color: #18313a;
      }
      .wrap {
        max-width: 1160px;
        margin: 40px auto;
        padding: 0 22px;
      }
      .heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 24px;
      }
      .eyebrow {
        color: #64777e;
        font-size: 12px;
        letter-spacing: 0.08em;
      }
      .sort-button {
        padding: 0;
        background: none;
        border: 0;
        color: inherit;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        gap: 6px;
        align-items: center;
      }
      .mobile-sort {
        display: none;
      }
      h1 {
        font-size: 34px;
        margin: 0;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 11px 18px;
        background: #087e8b;
        color: white;
        text-decoration: none;
        font-weight: 700;
      }
      .table {
        overflow: auto;
        border-top: 1px solid #d6e1e4;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 14px;
      }
      th,
      td {
        padding: 15px;
        border-bottom: 1px solid #edf1f2;
        vertical-align: middle;
      }
      th {
        color: #64777e;
        font-size: 12px;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .actions button {
        padding: 7px 10px;
        background: #fff;
        border: 1px solid #d6e1e4;
        color: #18313a;
        font: inherit;
        cursor: pointer;
      }
      .actions button.danger {
        color: #b42318;
        border-color: #efc3c3;
      }
      .actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .edit-name,
      .edit-email,
      .edit-role {
        width: 100%;
        min-width: 0;
        padding: 8px;
        border: 1px solid #087e8b;
        font: inherit;
        background: #fff;
      }
      .role-hint {
        display: block;
        margin-top: 4px;
        color: #64777e;
        font-size: 11px;
      }
      .error {
        color: #b42318;
      }
      @media (max-width: 650px) {
        .heading {
          align-items: flex-start;
          flex-direction: column;
        }
        .mobile-sort {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: end;
          margin-bottom: 12px;
        }
        .mobile-sort label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          color: #64777e;
        }
        .mobile-sort select {
          width: 100%;
          padding: 8px;
          border: 1px solid #d6e1e4;
          background: white;
          font: inherit;
        }
        .mobile-sort button {
          padding: 8px 10px;
          border: 1px solid #d6e1e4;
          background: white;
          font: inherit;
          white-space: nowrap;
        }
        .table {
          overflow: visible;
        }
        table,
        tbody {
          display: block;
          width: 100%;
        }
        thead {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        tbody tr {
          display: block;
          border-bottom: 1px solid #cbd5d9;
          padding: 8px 0;
        }
        td {
          display: grid;
          grid-template-columns: minmax(90px, 35%) minmax(0, 1fr);
          gap: 10px;
          padding: 8px 12px;
          border: 0;
          overflow-wrap: anywhere;
        }
        td::before {
          content: attr(data-label);
          font-weight: 700;
          color: #64777e;
        }
        td[colspan] {
          display: block;
        }
        td[colspan]::before {
          content: none;
        }
        .actions {
          align-items: stretch;
        }
      }
    `,
  ],
})
export class UsersListComponent {
  readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  readonly users = signal<ManagedUser[]>([]);
  readonly sortBy = signal<UserSortField>('createdAt');
  readonly sortDirection = signal<'ASC' | 'DESC'>('DESC');
  readonly sortedUsers = computed(() => {
    const multiplier = this.sortDirection() === 'ASC' ? 1 : -1;
    const field = this.sortBy();
    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
    return [...this.users()].sort((a, b) => {
      const result =
        field === 'createdAt'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : collator.compare(
              field === 'role' ? this.roleLabel(a.role) : a[field],
              field === 'role' ? this.roleLabel(b.role) : b[field],
            );
      return result * multiplier;
    });
  });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly actionBusy = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editName = signal('');
  readonly editEmail = signal('');
  readonly editRole = signal<AuthUser['role']>('OPERATOR');
  readonly roleLabel = (role: ManagedUser['role']) =>
    role === 'SUPERVISOR' ? 'Supervisor' : 'Operador';

  toggleSort(field: UserSortField) {
    if (this.sortBy() === field) this.toggleSortDirection();
    else {
      this.sortBy.set(field);
      this.sortDirection.set('ASC');
    }
  }

  setSortBy(value: string) {
    const fields: UserSortField[] = ['fullName', 'email', 'role', 'createdAt'];
    if (fields.includes(value as UserSortField) && value !== this.sortBy()) {
      this.sortBy.set(value as UserSortField);
      this.sortDirection.set('ASC');
    }
  }

  toggleSortDirection() {
    this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
  }

  sortIndicator(field: UserSortField) {
    return this.sortBy() !== field ? '↕' : this.sortDirection() === 'ASC' ? '↑' : '↓';
  }

  sortAria(field: UserSortField) {
    return this.sortBy() !== field
      ? 'none'
      : this.sortDirection() === 'ASC'
        ? 'ascending'
        : 'descending';
  }

  constructor() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.error.set('');
    this.auth.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        const message = error.error?.message ?? 'No se pudo cargar el listado de usuarios.';
        this.error.set(message);
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        this.loading.set(false);
      },
    });
  }

  startEdit(user: ManagedUser) {
    this.actionError.set('');
    this.editingId.set(user.id);
    this.editName.set(user.fullName);
    this.editEmail.set(user.email);
    this.editRole.set(user.role);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editName.set('');
    this.editEmail.set('');
    this.editRole.set('OPERATOR');
    this.actionError.set('');
  }

  saveUser(user: ManagedUser) {
    const fullName = this.editName().trim();
    const email = this.editEmail().trim().toLowerCase();
    if (fullName.length < 2 || fullName.length > 120) {
      this.actionError.set('El nombre completo debe tener entre 2 y 120 caracteres.');
      return;
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
      this.actionError.set('Introduce un correo válido, por ejemplo nombre@empresa.com.');
      return;
    }
    const changes: { fullName: string; email: string; role?: AuthUser['role'] } = {
      fullName,
      email,
    };
    if (user.id !== this.auth.user()?.id) changes.role = this.editRole();
    this.actionBusy.set(true);
    this.actionError.set('');
    this.auth.updateUser(user.id, changes).subscribe({
      next: (updated) => {
        this.users.update((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
        this.cancelEdit();
        this.actionBusy.set(false);
      },
      error: (error) => {
        const message = error.error?.message ?? 'No se pudieron guardar los cambios del usuario.';
        this.actionError.set(message);
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        this.actionBusy.set(false);
      },
    });
  }

  deleteUser(user: ManagedUser) {
    if (user.id === this.auth.user()?.id) return;
    if (!window.confirm(`¿Eliminar a ${user.fullName}? Esta acción no se puede deshacer.`)) return;
    this.actionBusy.set(true);
    this.actionError.set('');
    this.auth.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update((rows) => rows.filter((row) => row.id !== user.id));
        this.actionBusy.set(false);
      },
      error: (error) => {
        const message = error.error?.message ?? 'No se pudo eliminar el usuario.';
        this.actionError.set(message);
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        this.actionBusy.set(false);
      },
    });
  }
}
