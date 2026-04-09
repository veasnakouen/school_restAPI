import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Permission } from './permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  // Replace with real API integration
  getPermissions(): Observable<Permission[]> {
    return of([]);
  }
  getPermission(id: string): Observable<Permission | undefined> {
    return of(undefined);
  }
  createPermission(permission: Permission): Observable<Permission> {
    return of(permission);
  }
  updatePermission(permission: Permission): Observable<Permission> {
    return of(permission);
  }
  deletePermission(id: string): Observable<void> {
    return of();
  }
}
