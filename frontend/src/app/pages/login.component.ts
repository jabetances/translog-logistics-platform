import { MatButtonModule } from '@angular/material/button';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
@Component({ selector:'app-login', standalone:true, imports:[ReactiveFormsModule, RouterLink, MatButtonModule], template:
  '<section class="card narrow"><p class="eyebrow">ACCESO DE OPERADORES</p><h1>Iniciar sesión</h1><form [formGroup]="form" (ngSubmit)="submit()"><label>Correo<input type="email" formControlName="email" autocomplete="username"></label><label>Contraseña<input type="password" formControlName="password" autocomplete="current-password"></label>@if(error()){<p class="error">{{error()}}</p>}<button mat-flat-button color="primary" [disabled]="form.invalid || loading()">{{loading() ? "Entrando…" : "Entrar"}}</button></form><a routerLink="/tracking">Consultar envío sin iniciar sesión</a></section>', styles:[':host{display:block;padding:48px 20px}.narrow{max-width:420px;margin:auto}.card{background:white;padding:32px;border-radius:0;box-shadow:none}label{display:grid;gap:8px;margin:16px 0;font-weight:600}input{padding:12px;border:1px solid #d6e1e4;border-radius:0;font:inherit}button{width:100%;padding:12px;background:#087e8b;color:#fff;border:0;border-radius:0;font-weight:700;cursor:pointer}.error{color:#b42318}a{display:block;margin-top:20px;color:#087e8b}'] })
export class LoginComponent {
  private fb=inject(FormBuilder); private auth=inject(AuthService); private router=inject(Router);
  readonly loading=signal(false); readonly error=signal('');
  readonly form=this.fb.nonNullable.group({email:['',[Validators.required,Validators.email]],password:['',Validators.required]});
  submit(){if(this.form.invalid)return;this.loading.set(true);this.error.set('');this.auth.login(this.form.getRawValue().email,this.form.getRawValue().password).subscribe({next:()=>this.router.navigateByUrl('/shipments'),error:(e)=>{this.error.set(e.error?.message??'No se pudo iniciar sesión');this.loading.set(false);}});}
}
