import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './user.model';
import { ApiClientService } from '../core/services/api-client.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiClientService);

  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('UserManagement');
  }

  getUser(id: string): Observable<User> {
    return this.api.get<User>(`UserManagement/${id}`);
  }

  createUser(user: { userName: string, fullName: string, email: string, password: string, roles: string[] }): Observable<any> {
    return this.api.post<any>('UserManagement', user);
  }

  updateUser(user: User): Observable<User> {
    const payload = {
      userName: user.userName,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roles: user.roles
    };
    return this.api.put<User>(`UserManagement/${user.id}`, payload);
  }

  deleteUser(id: string): Observable<any> {
    return this.api.delete<any>(`UserManagement/${id}`);
  }

  toggleUserStatus(id: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`UserManagement/${id}/toggle-status`, {});
  }

  getUserRolesAndClaims(id: string): Observable<any> {
    return this.api.get<any>(`UserManagement/${id}/roles-and-claims`);
  }

  assignRoleToUser(id: string, roleName: string): Observable<any> {
    // Backend expects [FromBody] string wrapped in quotes for JSON deserialization
    return this.api.post<any>(`UserManagement/${id}/roles`, JSON.stringify(roleName));
  }

  removeRoleFromUser(id: string, roleName: string): Observable<any> {
    return this.api.delete<any>(`UserManagement/${id}/roles/${roleName}`);
  }

  addClaimToUser(id: string, claim: { type: string, value: string }): Observable<any> {
    return this.api.post<any>(`UserManagement/${id}/claims`, claim);
  }

  removeClaimFromUser(id: string, claim: { type: string, value: string }): Observable<any> {
    // Note: The backend uses HttpDelete with [FromBody] which is not standard.
    // If ApiClient doesn't support body in delete, we might need a workaround.
    // Assuming standard usage for now or that we adjust the backend later if needed.
    return this.api.delete<any>(`UserManagement/${id}/claims`); // Needs custom body implementation if truly required
  }
}
