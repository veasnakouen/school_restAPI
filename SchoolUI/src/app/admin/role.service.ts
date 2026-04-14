import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Role } from './role.model';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private apiUrl = 'http://localhost:5001/api/roles';

  constructor(private http: HttpClient) {}

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  getRole(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  createRole(role: Role): Observable<Role> {
    // Map to backend DTO
    const payload = {
      roleName: role.name,
      permissions: role.permissions
    };
    return this.http.post<Role>(this.apiUrl, payload);
  }

  updateRole(role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${role.id}`, role);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}?id=${id}`);
  }

  // Permissions management for a role
  getRolePermissions(roleName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${roleName}/permissions`);
  }

  addPermissionToRole(roleName: string, permission: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${roleName}/permissions`, { permission });
  }

  removePermissionFromRole(roleName: string, permission: string): Observable<any> {
    return this.http.request('delete', `${this.apiUrl}/${roleName}/permissions`, { body: { permission } });
  }
}
