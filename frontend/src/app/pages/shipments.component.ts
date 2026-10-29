import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SpanishPaginatorIntl } from '../core/spanish-paginator-intl';
import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ShipmentsService,
  Shipment,
  ShipmentStatus,
  ShipmentSortField,
  SortDirection,
} from '../core/shipments.service';
import { shipmentStatusBadgeClass, shipmentStatusLabel } from '../core/shipment-status-labels';
import { NotificationService } from '../core/notification.service';
import { trimmedMinLength, trimmedRequired } from '../core/form-validators';

const optionalPhoneValidator: ValidatorFn = (control: AbstractControl) => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  if (!/^\+?[0-9\s().-]+$/.test(value) || value.length > 40) return { phoneFormat: true };
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? null : { phoneFormat: true };
};
const maxThreeDecimalsValidator: ValidatorFn = (control: AbstractControl) => {
  if (control.value === null || control.value === '') return null;
  const value = Number(control.value);
  return Number.isFinite(value) && Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8
    ? null
    : { maxDecimals: true };
};
@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatPaginatorModule,
    MatTableModule,
    MatSnackBarModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }, NotificationService],
  template: `<section class="wrap">
    <div class="heading">
      <div>
        <p class="eyebrow">CENTRO DE OPERACIONES</p>
        <h1>Envíos</h1>
      </div>
      <button mat-stroked-button (click)="showForm.set(!showForm())">
        {{ showForm() ? 'Cerrar' : '+ Nuevo envío' }}
      </button>
    </div>
    @if (showForm()) {
      <form class="card form" [formGroup]="form" (ngSubmit)="create()">
        <h2>Registrar envío</h2>
        <div class="grid">
          <label
            >Origen<input
              id="shipment-origin"
              formControlName="originAddress"
              minlength="3"
              maxlength="240"
              [attr.aria-invalid]="
                form.controls.originAddress.invalid &&
                (form.controls.originAddress.touched || form.controls.originAddress.dirty)
              "
              aria-describedby="shipment-origin-hint"
            /><small id="shipment-origin-hint" class="hint">Obligatorio · 3–240 caracteres.</small>
            @if (form.controls.originAddress.touched || form.controls.originAddress.dirty) {
              @if (form.controls.originAddress.hasError('required')) {
                <small class="field-error">Escribe la dirección de origen.</small>
              } @else if (form.controls.originAddress.hasError('minlength')) {
                <small class="field-error">Debe tener al menos 3 caracteres.</small>
              } @else if (form.controls.originAddress.hasError('maxlength')) {
                <small class="field-error">No puede superar 240 caracteres.</small>
              }
            }</label
          ><label
            >Destino<input
              id="shipment-destination"
              formControlName="destinationAddress"
              minlength="3"
              maxlength="240"
              [attr.aria-invalid]="
                form.controls.destinationAddress.invalid &&
                (form.controls.destinationAddress.touched || form.controls.destinationAddress.dirty)
              "
              aria-describedby="shipment-destination-hint"
            /><small id="shipment-destination-hint" class="hint"
              >Obligatorio · 3–240 caracteres.</small
            >
            @if (
              form.controls.destinationAddress.touched || form.controls.destinationAddress.dirty
            ) {
              @if (form.controls.destinationAddress.hasError('required')) {
                <small class="field-error">Escribe la dirección de destino.</small>
              } @else if (form.controls.destinationAddress.hasError('minlength')) {
                <small class="field-error">Debe tener al menos 3 caracteres.</small>
              } @else if (form.controls.destinationAddress.hasError('maxlength')) {
                <small class="field-error">No puede superar 240 caracteres.</small>
              }
            }</label
          ><label
            >Destinatario<input
              id="shipment-recipient"
              formControlName="recipientName"
              minlength="2"
              maxlength="160"
              [attr.aria-invalid]="
                form.controls.recipientName.invalid &&
                (form.controls.recipientName.touched || form.controls.recipientName.dirty)
              "
              aria-describedby="shipment-recipient-hint"
            /><small id="shipment-recipient-hint" class="hint"
              >Obligatorio · 2–160 caracteres.</small
            >
            @if (form.controls.recipientName.touched || form.controls.recipientName.dirty) {
              @if (form.controls.recipientName.hasError('required')) {
                <small class="field-error">Escribe el nombre del destinatario.</small>
              } @else if (form.controls.recipientName.hasError('minlength')) {
                <small class="field-error">Debe tener al menos 2 caracteres.</small>
              } @else if (form.controls.recipientName.hasError('maxlength')) {
                <small class="field-error">No puede superar 160 caracteres.</small>
              }
            }</label
          ><label
            >Teléfono (opcional)<input
              id="shipment-phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              formControlName="contactPhone"
              maxlength="40"
              [attr.aria-invalid]="
                form.controls.contactPhone.invalid &&
                (form.controls.contactPhone.touched || form.controls.contactPhone.dirty)
              "
              aria-describedby="shipment-phone-hint"
            /><small id="shipment-phone-hint" class="hint"
              >Opcional · 7–15 cifras; admite +, espacios, paréntesis y guiones.</small
            >
            @if (
              (form.controls.contactPhone.touched || form.controls.contactPhone.dirty) &&
              form.controls.contactPhone.hasError('phoneFormat')
            ) {
              <small class="field-error" role="alert"
                >Revisa el teléfono: debe llevar 7–15 cifras y solo usar +, espacios, paréntesis o
                guiones.</small
              >
            }</label
          ><label
            >Peso (kg)<input
              id="shipment-weight"
              type="number"
              inputmode="decimal"
              min="0.001"
              max="100000"
              step="0.001"
              formControlName="weightKg"
              [attr.aria-invalid]="
                form.controls.weightKg.invalid &&
                (form.controls.weightKg.touched || form.controls.weightKg.dirty)
              "
              aria-describedby="shipment-weight-hint"
            /><small id="shipment-weight-hint" class="hint"
              >Obligatorio · 0,001–100.000 kg; máximo 3 decimales.</small
            >
            @if (form.controls.weightKg.touched || form.controls.weightKg.dirty) {
              @if (form.controls.weightKg.hasError('required')) {
                <small class="field-error">Introduce el peso del paquete.</small>
              } @else if (form.controls.weightKg.hasError('min')) {
                <small class="field-error">El peso mínimo es 0,001 kg.</small>
              } @else if (form.controls.weightKg.hasError('max')) {
                <small class="field-error">El peso máximo es 100.000 kg.</small>
              } @else if (form.controls.weightKg.hasError('maxDecimals')) {
                <small class="field-error">Usa como máximo 3 decimales.</small>
              }
            }
          </label>
        </div>
        <button mat-flat-button color="primary" [disabled]="form.invalid || busy()">
          Crear envío
        </button>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </form>
    }
    <div class="toolbar">
      <h2>Todos los envíos</h2>
      <div class="filters">
        <input
          type="search"
          maxlength="100"
          aria-label="Buscar envíos"
          placeholder="Código, destinatario, dirección o teléfono"
          [value]="searchText()"
          (input)="searchText.set($any($event.target).value)"
          (keyup.enter)="applySearch()"
        /><select
          aria-label="Filtrar por estado"
          [value]="filter()"
          (change)="setFilter($any($event.target).value)"
        >
          <option value="">Todos los estados</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ statusLabel(s) }}</option>
          }
        </select>
        <div class="mobile-sort">
          <label
            >Ordenar por<select
              aria-label="Ordenar envíos por"
              [value]="sortBy()"
              (change)="setSortBy($any($event.target).value)"
            >
              <option value="trackingCode">Seguimiento</option>
              <option value="recipientName">Destinatario</option>
              <option value="destinationAddress">Destino</option>
              <option value="status">Estado</option>
              <option value="createdAt">Fecha</option>
            </select></label
          ><button mat-stroked-button type="button" (click)="toggleSortDirection()">
            {{ sortDirection() === 'ASC' ? 'Ascendente ↑' : 'Descendente ↓' }}
          </button>
        </div>
        <button mat-stroked-button type="button" (click)="applySearch()">Buscar</button
        ><button mat-button type="button" (click)="clearFilters()">Limpiar</button>
      </div>
    </div>
    @if (busy() && !showForm()) {
      <p>Cargando…</p>
    }
    @if (error() && !showForm()) {
      <p class="error">{{ error() }}</p>
    }
    <div class="table card">
      <table mat-table [dataSource]="shipments()" class="shipments-table">
        <ng-container matColumnDef="trackingCode"
          ><th mat-header-cell *matHeaderCellDef [attr.aria-sort]="sortAria('trackingCode')">
            <button class="sort-button" type="button" (click)="toggleSort('trackingCode')">
              Seguimiento <span aria-hidden="true">{{ sortIndicator('trackingCode') }}</span>
            </button>
          </th>
          <td mat-cell *matCellDef="let item" data-label="Seguimiento">
            <a [routerLink]="['/shipments', item.id]">{{ item.trackingCode }}</a>
          </td></ng-container
        >
        <ng-container matColumnDef="recipientName"
          ><th mat-header-cell *matHeaderCellDef [attr.aria-sort]="sortAria('recipientName')">
            <button class="sort-button" type="button" (click)="toggleSort('recipientName')">
              Destinatario <span aria-hidden="true">{{ sortIndicator('recipientName') }}</span>
            </button>
          </th>
          <td mat-cell *matCellDef="let item" data-label="Destinatario">
            {{ item.recipientName }}
          </td></ng-container
        >
        <ng-container matColumnDef="destinationAddress"
          ><th mat-header-cell *matHeaderCellDef [attr.aria-sort]="sortAria('destinationAddress')">
            <button class="sort-button" type="button" (click)="toggleSort('destinationAddress')">
              Destino <span aria-hidden="true">{{ sortIndicator('destinationAddress') }}</span>
            </button>
          </th>
          <td mat-cell *matCellDef="let item" data-label="Destino">
            {{ item.destinationAddress }}
          </td></ng-container
        >
        <ng-container matColumnDef="status"
          ><th mat-header-cell *matHeaderCellDef [attr.aria-sort]="sortAria('status')">
            <button class="sort-button" type="button" (click)="toggleSort('status')">
              Estado <span aria-hidden="true">{{ sortIndicator('status') }}</span>
            </button>
          </th>
          <td mat-cell *matCellDef="let item" data-label="Estado">
            <span [class]="'badge status-badge ' + statusBadgeClass(item.status)">{{
              statusLabel(item.status)
            }}</span>
          </td></ng-container
        >
        <ng-container matColumnDef="createdAt"
          ><th mat-header-cell *matHeaderCellDef [attr.aria-sort]="sortAria('createdAt')">
            <button class="sort-button" type="button" (click)="toggleSort('createdAt')">
              Fecha <span aria-hidden="true">{{ sortIndicator('createdAt') }}</span>
            </button>
          </th>
          <td mat-cell *matCellDef="let item" data-label="Fecha">
            {{ item.createdAt | date: 'd/M/yy, HH:mm' }}
          </td></ng-container
        >
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
      @if (!busy() && !error() && shipments().length === 0) {
        <p class="empty-row">No hay envíos para mostrar.</p>
      }
      <mat-paginator
        [length]="total()"
        [pageIndex]="page() - 1"
        [pageSize]="pageSize()"
        [pageSizeOptions]="[10, 20, 50]"
        [showFirstLastButtons]="true"
        (page)="onPage($event)"
        aria-label="Paginación de envíos"
      ></mat-paginator>
    </div>
  </section>`,
  styles: [
    '.wrap{max-width:1160px;margin:40px auto;padding:0 22px}.heading,.toolbar{display:flex;align-items:center;justify-content:space-between}.eyebrow{color:#64777e;font-size:12px;letter-spacing:.08em}h1{font-size:34px;margin:0 0 24px}h2{font-size:18px}.card{background:white;border-radius:0;box-shadow:none}.heading button,.form button{background:#087e8b;color:white;padding:11px 18px;border:0;border-radius:0;font-weight:700;cursor:pointer}.form{padding:20px;margin:12px 0 24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}.form label{display:grid;gap:6px;font-size:13px}.hint{color:#64777e;font-size:12px;font-weight:400}.field-error{color:#b42318;font-size:12px}.form input,select{padding:10px;border:1px solid #d6e1e4;border-radius:0;font:inherit}.toolbar{margin:32px 0 14px}.filters{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.filters input,.filters select,.filters button{height:42px;box-sizing:border-box}.filters input{min-width:260px;flex:1;padding:10px;border:1px solid #d6e1e4;border-radius:0;font:inherit}.filters button{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}.mobile-sort{display:none}.sort-button{padding:0;background:none;border:0;color:inherit;font:inherit;font-weight:700;cursor:pointer;display:inline-flex;gap:6px;align-items:center}.table{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:14px}th,td{padding:15px;border-bottom:1px solid #edf1f2}th{color:#64777e;font-size:12px}td a{color:#087e8b;font-weight:700}.badge{background:#e5f4f2;color:#087e8b;padding:6px 10px;border-radius:0;font-size:11px}.pager{display:flex;justify-content:flex-end;align-items:center;gap:16px;padding:18px}.pager button{padding:8px 12px;border:1px solid #d6e1e4;border-radius:0;background:white}@media(max-width:650px){.table{overflow:visible}table,tbody{display:block;width:100%}thead{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}tbody tr{display:block;border-bottom:1px solid #cbd5d9;padding:8px 0}td{display:grid;grid-template-columns:minmax(100px,35%) minmax(0,1fr);gap:10px;padding:8px 12px;border:0;overflow-wrap:anywhere}td::before{content:attr(data-label);font-weight:700;color:#64777e}td[colspan]{display:block}td[colspan]::before{content:none}.toolbar{align-items:stretch;flex-direction:column;gap:8px}.filters{display:grid;grid-template-columns:1fr;width:100%}.filters input,.filters select,.filters button{width:100%;min-width:0}.mobile-sort{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end}.mobile-sort label{display:grid;gap:6px;font-size:12px;color:#64777e}.mobile-sort button{height:42px;white-space:nowrap}.pager{justify-content:center;gap:8px;flex-wrap:wrap}}.error{color:#b42318}',
  ],
})
export class ShipmentsComponent {
  private fb = inject(FormBuilder);
  private api = inject(ShipmentsService);
  private notifications = inject(NotificationService);
  readonly statusLabel = shipmentStatusLabel;
  readonly statusBadgeClass = shipmentStatusBadgeClass;
  readonly shipments = signal<Shipment[]>([]);
  readonly page = signal(1);
  readonly total = signal(0);
  readonly pageSize = signal(20);
  readonly displayedColumns = [
    'trackingCode',
    'recipientName',
    'destinationAddress',
    'status',
    'createdAt',
  ];
  readonly showForm = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly filter = signal('');
  readonly searchText = signal('');
  readonly sortBy = signal<ShipmentSortField>('createdAt');
  readonly sortDirection = signal<SortDirection>('DESC');
  readonly statuses: ShipmentStatus[] = [
    'CREATED',
    'IN_WAREHOUSE',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'RETURNED',
    'CANCELLED',
  ];
  readonly form = this.fb.nonNullable.group({
    originAddress: [
      '',
      [Validators.required, trimmedRequired, trimmedMinLength(3), Validators.maxLength(240)],
    ],
    destinationAddress: [
      '',
      [Validators.required, trimmedRequired, trimmedMinLength(3), Validators.maxLength(240)],
    ],
    recipientName: [
      '',
      [Validators.required, trimmedRequired, trimmedMinLength(2), Validators.maxLength(160)],
    ],
    contactPhone: ['', optionalPhoneValidator],
    weightKg: [
      1,
      [
        Validators.required,
        Validators.min(0.001),
        Validators.max(100000),
        maxThreeDecimalsValidator,
      ],
    ],
  });
  constructor() {
    this.load();
  }
  load(page = 1) {
    this.busy.set(true);
    this.error.set('');
    this.api
      .list(
        page,
        this.filter() || undefined,
        this.searchText().trim() || undefined,
        this.sortBy(),
        this.sortDirection(),
        this.pageSize(),
      )
      .subscribe({
        next: (r) => {
          this.shipments.set(r.data);
          this.page.set(r.pagination.page);
          this.total.set(r.pagination.total);
          this.busy.set(false);
        },
        error: (e) => {
          const message = e.error?.message ?? 'No se pudo cargar la lista';
          this.error.set(message);
          this.notifications.showError(message);
          this.busy.set(false);
        },
      });
  }
  onPage(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.load(event.pageIndex + 1);
  }
  setFilter(value: string) {
    this.filter.set(value);
    this.load(1);
  }
  toggleSort(field: ShipmentSortField) {
    if (this.sortBy() === field) this.toggleSortDirection();
    else {
      this.sortBy.set(field);
      this.sortDirection.set('ASC');
      this.load(1);
    }
  }
  setSortBy(value: string) {
    const allowed: ShipmentSortField[] = [
      'trackingCode',
      'recipientName',
      'destinationAddress',
      'status',
      'createdAt',
    ];
    if (!allowed.includes(value as ShipmentSortField) || value === this.sortBy()) return;
    this.sortBy.set(value as ShipmentSortField);
    this.sortDirection.set('ASC');
    this.load(1);
  }
  toggleSortDirection() {
    this.sortDirection.set(this.sortDirection() === 'ASC' ? 'DESC' : 'ASC');
    this.load(1);
  }
  sortIndicator(field: ShipmentSortField) {
    return this.sortBy() !== field ? '↕' : this.sortDirection() === 'ASC' ? '↑' : '↓';
  }
  sortAria(field: ShipmentSortField) {
    return this.sortBy() !== field
      ? 'none'
      : this.sortDirection() === 'ASC'
        ? 'ascending'
        : 'descending';
  }
  applySearch() {
    this.load(1);
  }
  clearFilters() {
    this.filter.set('');
    this.searchText.set('');
    this.load(1);
  }
  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const payload = {
      originAddress: values.originAddress.trim(),
      destinationAddress: values.destinationAddress.trim(),
      recipientName: values.recipientName.trim(),
      contactPhone: values.contactPhone.trim() || undefined,
      weightKg: values.weightKg,
    };
    this.busy.set(true);
    this.error.set('');
    this.api.create(payload).subscribe({
      next: (shipment) => {
        this.showForm.set(false);
        this.form.reset({
          originAddress: '',
          destinationAddress: '',
          recipientName: '',
          contactPhone: '',
          weightKg: 1,
        });
        this.notifications.showSuccess('Envío creado: ' + shipment.trackingCode, 5000);
        this.load(1);
      },
      error: (e) => {
        const message = e.error?.message ?? 'No se pudo crear';
        this.error.set(message);
        this.notifications.showError(message);
        this.busy.set(false);
      },
    });
  }
}
