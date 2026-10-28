import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
@Component({selector:'app-root',imports:[RouterLink,RouterOutlet],templateUrl:'./app.html',styleUrl:'./app.scss'})
export class App { readonly auth=inject(AuthService); logout(){this.auth.logout();} }
