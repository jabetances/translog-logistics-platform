import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
const API = 'http://localhost:3000/api';
export type ShipmentStatus = 'CREATED' | 'IN_WAREHOUSE' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
export interface Shipment { id: string; trackingCode: string; recipientName: string; destinationAddress: string; originAddress: string; weightKg: string; status: ShipmentStatus; createdAt: string; deliveredAt?: string; events?: Array<{status: ShipmentStatus; location: string; notes?: string; createdAt: string}>; }
@Injectable({ providedIn: 'root' })
export class ShipmentsService {
  constructor(private http: HttpClient) {}
  list(page = 1, status?: string, search?: string) { let params = new HttpParams().set('page', page); if (status) params = params.set('status', status); if (search?.trim()) params = params.set('q', search.trim()); return this.http.get<{data: Shipment[]; pagination: {page:number;total:number;totalPages:number}}>(API + '/shipments', {params}); }
  create(data: {originAddress:string; destinationAddress:string; recipientName:string; contactPhone?:string; weightKg:number}) { return this.http.post<Shipment>(API + '/shipments', data); }
  detail(id: string) { return this.http.get<Shipment>(API + '/shipments/' + id); }
  changeStatus(id: string, data: {status:ShipmentStatus;location:string;notes?:string}) { return this.http.patch<Shipment>(API + '/shipments/' + id + '/status', data); }
  track(code: string): Observable<{trackingCode:string;status:ShipmentStatus;recipientName:string;destinationAddress:string;createdAt:string;deliveredAt?:string;events:NonNullable<Shipment['events']>}> { return this.http.get<any>(API + '/tracking/' + encodeURIComponent(code)); }
}
