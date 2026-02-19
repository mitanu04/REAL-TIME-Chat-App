import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = (route, state) => {
  if(inject(AuthService).isLoggedIn()){//verifica daca utilizatorul este deja autentificat
    return false;
  }
  return true;
};
