import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { UserManagementComponent } from './user-management.component';
import { RoleManagementComponent } from './role-management.component';
import { PermissionManagementComponent } from './permission-management.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'users', component: UserManagementComponent },
      { path: 'roles', component: RoleManagementComponent },
      { path: 'permissions', component: PermissionManagementComponent },
      { path: '', pathMatch: 'full', redirectTo: 'users' }
    ]
  }
];
