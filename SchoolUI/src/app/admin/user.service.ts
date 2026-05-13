import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './user.model';
import { ApiClientService } from '../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiClientService);

  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('users');
  }

  getUser(id: string): Observable<User> {
    return this.api.get<User>(`users/${id}`);
  }

  createUser(user: { userName: string, fullName: string, email: string, password: string, roles: string[] }): Observable<any> {
    return this.api.post<any>('users', user);
  }

  updateUser(user: User): Observable<User> {
    const payload = {
      userName: user.userName,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roles: user.roles
    };
    return this.api.put<User>(`users/${user.id}`, payload);
  }

  deleteUser(id: string): Observable<any> {
    return this.api.delete<any>(`users/${id}`);
  }

  toggleUserStatus(id: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`users/${id}/toggle-status`, {});
  }

  getUserRolesAndClaims(id: string): Observable<any> {
    return this.api.get<any>(`users/${id}/roles-and-claims`);
  }

  assignRoleToUser(id: string, roleName: string): Observable<any> {
    return this.api.post<any>(`users/${id}/roles`, { roleName });
  }

  removeRoleFromUser(id: string, roleName: string): Observable<any> {
    return this.api.delete<any>(`users/${id}/roles/${roleName}`);
  }
}
