import { DatePipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService, ManagedUser } from "../core/auth.service";

@Component({
  selector: "app-users-list",
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <section class="wrap">
      <div class="heading">
        <div><p class="eyebrow">GESTIÓN DE ACCESOS</p><h1>Usuarios</h1></div>
        <a class="button" routerLink="/users/new">+ Nuevo usuario</a>
      </div>
      @if (loading()) { <p>Cargando usuarios…</p> }
      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (!loading() && !error()) {
        <div class="table">
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Alta</th></tr></thead>
            <tbody>
              @for (item of users(); track item.id) {
                <tr>
                  <td data-label="Nombre">{{ item.fullName }}</td>
                  <td data-label="Correo">{{ item.email }}</td>
                  <td data-label="Rol">{{ roleLabel(item.role) }}</td>
                  <td data-label="Alta">{{ item.createdAt | date:"d/M/yy, HH:mm" }}</td>
                </tr>
              } @empty { <tr><td colspan="4">No hay usuarios registrados.</td></tr> }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;font-family:Inter,system-ui,sans-serif;color:#18313a}
    .wrap{max-width:1160px;margin:40px auto;padding:0 22px}
    .heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}
    .eyebrow{color:#64777e;font-size:12px;letter-spacing:.08em}
    h1{font-size:34px;margin:0}
    .button{display:inline-flex;align-items:center;justify-content:center;padding:11px 18px;background:#087e8b;color:white;text-decoration:none;font-weight:700}
    .table{overflow:auto;border-top:1px solid #d6e1e4}
    table{width:100%;border-collapse:collapse;text-align:left;font-size:14px}
    th,td{padding:15px;border-bottom:1px solid #edf1f2}
    th{color:#64777e;font-size:12px}
    .error{color:#b42318}
    @media(max-width:650px){
      .heading{align-items:flex-start;flex-direction:column}
      .table{overflow:visible}
      table,tbody{display:block;width:100%}
      thead{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      tbody tr{display:block;border-bottom:1px solid #cbd5d9;padding:8px 0}
      td{display:grid;grid-template-columns:minmax(90px,35%) minmax(0,1fr);gap:10px;padding:8px 12px;border:0;overflow-wrap:anywhere}
      td::before{content:attr(data-label);font-weight:700;color:#64777e}
      td[colspan]{display:block}
      td[colspan]::before{content:none}
    }
  `],
})
export class UsersListComponent {
  private readonly auth = inject(AuthService);
  readonly users = signal<ManagedUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly roleLabel = (role: ManagedUser["role"]) => role === "SUPERVISOR" ? "Supervisor" : "Operador";

  constructor() { this.load(); }

  private load() {
    this.loading.set(true);
    this.error.set("");
    this.auth.listUsers().subscribe({
      next: (users) => { this.users.set(users); this.loading.set(false); },
      error: (error) => { this.error.set(error.error?.message ?? "No se pudo cargar el listado de usuarios."); this.loading.set(false); },
    });
  }
}
