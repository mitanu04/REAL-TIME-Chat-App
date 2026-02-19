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


@Component({
  selector: 'app-login',
  imports: [CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email!: string;
  password!: string;

  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);



hide=signal(false);

  login(){
    this.authService.login(this.email,this.password)
      .subscribe({
        next:()=>{
          this.authService.me().subscribe();
          this.snackBar.open('Logged in succesfully','Close');
        },
        error: (err:HttpErrorResponse)=> {
          let error = err.error as ApiResponse<string>;

          this.snackBar.open(err.error,"Close",{duration: 3000});
        },
        complete: ()=>{
      this.router.navigate(['/'])
    }
      })
  }


  togglePassword(event: MouseEvent){
    this.hide.set(!this.hide() );
    event.stopPropagation();

  }
}
