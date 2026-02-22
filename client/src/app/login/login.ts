//import { Component } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import {AuthService} from '../services/auth.service';
import { CommonModule } from '@angular/common';
//import {MatFormFieldModule} from '@angular/material/form-field'
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input';   // aproape sigur ai nevoie și de asta
import { FormsModule } from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar'
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-login',
  imports: [CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email!: string;
  password!: string;

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);


isLoading = signal(false);

login() {
  this.isLoading.set(true);
  this.authService.login(this.email, this.password)
    .subscribe({
      next: () => {
        this.authService.me().subscribe();
        this.snackBar.open('Logged in successfully', 'Close', { duration: 500 });
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.snackBar.open(err.error, "Close", { duration: 3000 });
      },
      complete: () => {
        this.router.navigate(['/']);
      }
    });
}


  togglePassword(event: MouseEvent){
    this.isLoading.set(!this.isLoading());
    event.stopPropagation();

  }
}
