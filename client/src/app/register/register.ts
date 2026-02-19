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
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {


  email!: string;
  password!: string;
  userName!: string;
  fullName!: string;
  profilePicture: string = 'https://randomuser.me/api/portraits/lego/5.jpg';
  profileImageFile: File| null= null;

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);
  router = inject(Router);

  hide=signal(false);


  togglePassword(event: MouseEvent){
    
    this.hide.set(!this.hide());
  }


  register() {
  let formData = new FormData();
  formData.append('email',this.email);
  formData.append('password',this.password);
  formData.append('fullName',this.fullName);
  formData.append('userName',this.userName);
  formData.append('profileImage',this.profileImageFile!);

  this.authService.register(formData).subscribe({
    next:()=>{
      this.snackBar.open('User registered succesfully', 'Close');
    },
    error:(error:HttpErrorResponse)=>{
      let err=error.error as ApiResponse<string>;
      this.snackBar.open(err.error,"Close");
    },
    complete: ()=>{
      this.router.navigate(['/'])
    }
  });
}

  onFileSelected(event:any){
    const file:File = event.target.files[0];
    if(file){
    this.profileImageFile = file;

    const reader = new FileReader();
    reader.onload=(e)=>{
      this.profilePicture = e.target!.result as string;
      console.log(e.target?.result)
    };
    reader.readAsDataURL(file);
    console.log(this.profilePicture)
  }

}

}