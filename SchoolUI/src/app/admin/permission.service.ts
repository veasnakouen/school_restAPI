import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Permission } from './permission.model';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  // Development API URL - change to production HTTPS endpoint as needed
  private apiUrl = 'http://localhost:5001/api/permissions';

  constructor(private http: HttpClient) {}

  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.apiUrl);
  }

  getPermission(id: string): Observable<Permission> {
    return this.http.get<Permission>(`${this.apiUrl}/${id}`);
  }

  createPermission(permission: Permission): Observable<Permission> {
    return this.http.post<Permission>(this.apiUrl, permission);
  }

  updatePermission(permission: Permission): Observable<Permission> {
    return this.http.put<Permission>(`${this.apiUrl}/${permission.id}`, permission);
  }

  deletePermission(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
