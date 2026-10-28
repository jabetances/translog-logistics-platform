import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
const API = 'http://localhost:3000/api';
export type ShipmentStatus =
  | 'CREATED'
  | 'IN_WAREHOUSE'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';
export type ShipmentSortField =
  'trackingCode' | 'recipientName' | 'destinationAddress' | 'status' | 'createdAt';
export type SortDirection = 'ASC' | 'DESC';
export interface Shipment {
  id: string;
  trackingCode: string;
  recipientName: string;
  destinationAddress: string;
  originAddress: string;
  weightKg: number;
  status: ShipmentStatus;
  createdAt: string;
  deliveredAt?: string;
  createdByName?: string | null;
  allowedTransitions?: ShipmentStatus[];
  events?: Array<{
    id?: string;
    status: ShipmentStatus;
    location: string;
    notes?: string | null;
    actorName?: string | null;
    createdAt: string;
  }>;
}
export interface PublicTracking {
  trackingCode: string;
  status: ShipmentStatus;
  createdAt: string;
  deliveredAt: string | null;
  events: Array<{
    id: string;
    status: ShipmentStatus;
    location: string;
    notes: string | null;
    createdAt: string;
  }>;
}
@Injectable({ providedIn: 'root' })
export class ShipmentsService {
  constructor(private http: HttpClient) {}
  list(
    page = 1,
    status?: string,
    search?: string,
    sortBy: ShipmentSortField = 'createdAt',
    sortDirection: SortDirection = 'DESC',
    limit = 20,
  ) {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    if (status) params = params.set('status', status);
    if (search?.trim()) params = params.set('q', search.trim());
    return this.http.get<{
      data: Shipment[];
      pagination: { page: number; total: number; totalPages: number };
    }>(API + '/shipments', { params });
  }
  create(data: {
    originAddress: string;
    destinationAddress: string;
    recipientName: string;
    contactPhone?: string;
    weightKg: number;
  }) {
    return this.http.post<Shipment>(API + '/shipments', data);
  }
  detail(id: string) {
    return this.http.get<Shipment>(API + '/shipments/' + id);
  }
  changeStatus(id: string, data: { status: ShipmentStatus; location: string; notes?: string }) {
    return this.http.patch<Shipment>(API + '/shipments/' + id + '/status', data);
  }
  cancel(id: string) {
    return this.http.delete<Shipment>(API + '/shipments/' + id);
  }
  track(code: string): Observable<PublicTracking> {
    return this.http.get<PublicTracking>(API + '/tracking/' + encodeURIComponent(code));
  }
}
