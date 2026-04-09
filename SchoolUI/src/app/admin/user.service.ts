import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  // Replace with real API integration
  getUsers(): Observable<User[]> {
    return of([]);
  }
  getUser(id: string): Observable<User | undefined> {
    return of(undefined);
  }
  createUser(user: User): Observable<User> {
    return of(user);
  }
  updateUser(user: User): Observable<User> {
    return of(user);
  }
  deleteUser(id: string): Observable<void> {
    return of();
  }
}
