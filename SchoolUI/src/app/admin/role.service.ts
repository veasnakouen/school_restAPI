import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Role } from './role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  // Replace with real API integration
  getRoles(): Observable<Role[]> {
    return of([]);
  }
  getRole(id: string): Observable<Role | undefined> {
    return of(undefined);
  }
  createRole(role: Role): Observable<Role> {
    return of(role);
  }
  updateRole(role: Role): Observable<Role> {
    return of(role);
  }
  deleteRole(id: string): Observable<void> {
    return of();
  }
}
