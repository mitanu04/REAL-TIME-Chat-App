import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { Form } from '@angular/forms';
import { User } from '../models/user';
//import {AuthServiceService} from '../services/auth-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  
  private baseUrl = 'http://localhost:5000/api/account';
  private token= "token";

 private httpClient = inject(HttpClient);

  register(data:FormData): Observable<ApiResponse<string>> {
    return this.httpClient.post<ApiResponse<string>>(`${this.baseUrl}/register`, data
    ).pipe(tap((response) => {
      localStorage.setItem(this.token, response.data);
    })
    )
  }

  login(email:string,password:string): Observable<ApiResponse<string>> {
    return this.httpClient.post<ApiResponse<string>>(`${this.baseUrl}/login`,{
      email,
      password
    })
    .pipe(
      tap((response)=>{
      if(response.isSuccess) {
        localStorage.setItem(this.token,response.data);
      }

      return response;
    })
    );
  }

  me():Observable<ApiResponse<User>>{
      return this.httpClient.get<ApiResponse<User>>(`${this.baseUrl}/me`,{
        headers:{
          Authorization: `Bearer ${this.getAccessToken}`,
        },
      })
      .pipe(
        tap((response)=>{
          if(response.isSuccess){
            localStorage.setItem("user",JSON.stringify(response.data));

          }
        })
      )
    }


  get getAccessToken(): string| null {
    return localStorage.getItem(this.token) || '';
  }

  isLoggedIn(): boolean{
    return !!localStorage.getItem(this.token);//daca token exista returneaza truei daca token e null returneaza false
  }


  logout() {
    localStorage.removeItem(this.token);
    localStorage.removeItem('user');
    localStorage.removeItem("loglevel");
    localStorage.removeItem("6cb1f90cba489c85caa3c2ee6ebd0ccc");
  }

  get currentLoggedUser() : User | null
  {
    const user:User=JSON.parse(localStorage.getItem('user') || '{}');
    return user;    
  }
}
