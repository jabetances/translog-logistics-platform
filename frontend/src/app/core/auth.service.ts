import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
const API = 'http://localhost:3000/api';
export interface AuthUser { id: string; email: string; fullName: string; role: 'OPERATOR' | 'SUPERVISOR'; }
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'translog_token';
  readonly user = signal<AuthUser | null>(this.readUser());
  constructor(private http: HttpClient) {}
  get token() { return localStorage.getItem(this.tokenKey); }
  register(data: {email:string;password:string;fullName:string;role:'OPERATOR'|'SUPERVISOR'}) { return this.http.post<AuthUser>(API + '/auth/register', data); }
  login(email: string, password: string) { return this.http.post<{ accessToken: string; user: AuthUser }>(API + '/auth/login', { email, password }).pipe(tap((r) => { localStorage.setItem(this.tokenKey, r.accessToken); localStorage.setItem('translog_user', JSON.stringify(r.user)); this.user.set(r.user); })); }
  logout() { localStorage.removeItem(this.tokenKey); localStorage.removeItem('translog_user'); this.user.set(null); }
  private readUser(): AuthUser | null { try { return JSON.parse(localStorage.getItem('translog_user') ?? 'null') as AuthUser | null; } catch { return null; } }
}
