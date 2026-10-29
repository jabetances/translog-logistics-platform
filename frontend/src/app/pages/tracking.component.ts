import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicTracking, ShipmentsService, ShipmentStatus } from '../core/shipments.service';
import { shipmentStatusBadgeClass, shipmentStatusLabel } from '../core/shipment-status-labels';
import { NotificationService } from '../core/notification.service';
@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, MatButtonModule, MatSnackBarModule],
  providers: [NotificationService],
  template: `<section class="card">
    <p class="eyebrow">SEGUIMIENTO PÚBLICO</p>
    <h1>¿Dónde está tu envío?</h1>
    <form [formGroup]="form" (ngSubmit)="search()">
      <div class="search-field">
        <label for="tracking-code">Código de seguimiento</label>
        <div class="search-controls">
          <input
            id="tracking-code"
            formControlName="code"
            placeholder="ENV-20261028-AB12"
            aria-label="Código de seguimiento"
            minlength="17"
            maxlength="17"
            [attr.aria-invalid]="
              form.controls.code.invalid && (form.controls.code.touched || form.controls.code.dirty)
            "
            aria-describedby="tracking-code-help"
          /><button
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || loading()"
            [attr.aria-busy]="loading()"
          >
            {{ loading() ? 'Buscando…' : 'Buscar' }}
          </button>
        </div>
        <div class="search-feedback" aria-live="polite">
          @if (
            (form.controls.code.touched || form.controls.code.dirty) && form.controls.code.invalid
          ) {
            @if (form.controls.code.hasError('required')) {
              <small class="field-error" role="alert">Introduce el código de seguimiento.</small>
            } @else if (form.controls.code.hasError('pattern')) {
              <small class="field-error" role="alert"
                >Formato incorrecto; ejemplo: ENV-20261028-AB12.</small
              >
            }
          } @else {
            <small id="tracking-code-help" class="hint"
              >Formato: ENV-AAAAMMDD-XXXX (17 caracteres).</small
            >
          }
        </div>
      </div>
    </form>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    @if (result(); as item) {
      <div class="result">
        <div class="row">
          <div>
            <small>SEGUIMIENTO</small>
            <h2>{{ item.trackingCode }}</h2>
          </div>
          <span [class]="'badge status-badge ' + statusBadgeClass(item.status)">{{
            statusLabel(item.status)
          }}</span>
        </div>
        @if (item.status === 'DELIVERED') {
          <div class="delivered-banner" role="status">
            <span class="delivered-check" aria-hidden="true">✓</span>
            <div class="delivered-copy">
              <small>ESTADO DEL PAQUETE</small><strong>ENTREGADO</strong>
              <p>Recepción confirmada por el destinatario.</p>
              @if (item.deliveredAt) {
                <small class="delivery-date"
                  >Entregado el {{ item.deliveredAt | date: 'd MMM y, HH:mm:ss' }}</small
                >
              }
            </div>
          </div>
        }
        <p>Consulta el historial de eventos del envío asociado a este código.</p>
        <h3>Historial</h3>
        <ol class="timeline" aria-label="Historial cronológico del envío">
          @for (event of item.events; track event.id; let isLatest = $last) {
            <li class="timeline-item" [attr.aria-current]="isLatest ? 'step' : null">
              <span class="timeline-connector" aria-hidden="true"></span>
              <span
                class="timeline-dot"
                [class.timeline-dot-latest]="isLatest"
                aria-hidden="true"
              ></span>
              <div class="timeline-event">
                <div class="timeline-heading">
                  <strong>{{ statusLabel(event.status) }}</strong>
                  <time [attr.datetime]="event.createdAt">{{
                    event.createdAt | date: 'd MMM y, HH:mm:ss'
                  }}</time>
                </div>
                <p class="timeline-location">{{ event.location }}</p>
                @if (event.notes) {
                  <p class="timeline-notes">{{ event.notes }}</p>
                }
              </div>
            </li>
          }
        </ol>
      </div>
    }
  </section>`,
  styles: [
    ':host{display:block;max-width:780px;margin:48px auto;padding:0 20px}.card{background:white;padding:32px;border-radius:0;box-shadow:none}form{display:block}.search-field{display:grid;gap:6px;min-width:0;font-size:13px}.search-controls{display:flex;align-items:stretch;gap:10px}.search-feedback{min-height:36px;display:grid;align-content:start}input{flex:1;min-width:0;height:46px;padding:12px;border:1px solid #d6e1e4;border-radius:0;font:inherit}.hint{color:#64777e;font-size:12px;letter-spacing:normal}.field-error{color:#b42318;font-size:12px;letter-spacing:normal}button{height:46px;padding:0 20px;background:#087e8b;color:white;border:0;border-radius:0;font-weight:700;white-space:nowrap}.eyebrow,small{color:#64777e;font-size:12px;letter-spacing:.08em}.row{display:flex;justify-content:space-between;align-items:center}.badge{background:#dff5f1;color:#087e8b;padding:8px 12px;border-radius:0;font-size:12px}.delivered-banner{display:flex;align-items:center;gap:16px;margin:20px 0;padding:18px 20px;background:#e7f5eb;border-left:8px solid #118043;color:#144d2a}.delivered-check{display:grid;place-items:center;width:52px;height:52px;flex:0 0 52px;background:#118043;color:#fff;font-size:34px;font-weight:900}.delivered-copy small{display:block;color:#14532d;letter-spacing:.12em;font-weight:700}.delivered-copy strong{display:block;margin:4px 0;font-size:26px;letter-spacing:.04em;line-height:1.05}.delivered-copy p{margin:3px 0 6px}.delivered-copy .delivery-date{font-size:13px;letter-spacing:normal}.error{color:#b42318}.result{margin-top:28px;border-top:1px solid #e5ecee;padding-top:20px}.timeline{list-style:none;margin:18px 0 0;padding:0}.timeline-item{display:grid;position:relative;grid-template-columns:20px minmax(0,1fr);column-gap:14px;padding:0 0 22px;border:0}.timeline-item:last-child{padding-bottom:0}.timeline-connector{position:absolute;z-index:0;top:20px;bottom:0;left:9px;width:2px;background:#cbd5d9}.timeline-item:last-child .timeline-connector{display:none}.timeline-dot{position:relative;z-index:1;display:block;width:20px;height:20px;border:3px solid #087e8b;border-radius:50%!important;background:#fff}.timeline-dot-latest{background:#087e8b;outline:4px solid #dff5f1}.timeline-event{min-width:0;padding:0 0 0 2px}.timeline-heading{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap}.timeline-heading strong{font-size:14px}.timeline-heading time{color:#64777e;font-size:12px}.timeline-location{margin:5px 0 0;color:#45616a}.timeline-notes{margin:7px 0 0;color:#64777e;font-size:13px}@media(max-width:520px){.delivered-banner{align-items:flex-start;padding:14px}.delivered-check{width:42px;height:42px;flex-basis:42px;font-size:28px}.delivered-copy strong{font-size:22px}.search-controls{gap:8px}button{padding:0 14px}}',
  ],
})
export class TrackingComponent {
  private fb = inject(FormBuilder);
  private service = inject(ShipmentsService);
  private notifications = inject(NotificationService);
  readonly statusLabel = shipmentStatusLabel;
  readonly statusBadgeClass = shipmentStatusBadgeClass;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly result = signal<PublicTracking | null>(null);
  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^ENV-[0-9]{8}-[A-Z0-9]{4}$/i)]],
  });
  search() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.result.set(null);
    this.service.track(this.form.controls.code.value.trim().toUpperCase()).subscribe({
      next: (r) => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        const message = e.error?.message ?? 'No se encontró el envío';
        this.error.set(message);
        this.notifications.showError(message);
        this.loading.set(false);
      },
    });
  }
}
