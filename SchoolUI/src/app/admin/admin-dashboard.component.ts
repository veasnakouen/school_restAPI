import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  // templateUrl: './admin-dashboard.component.html',
  template: `
  <div class="admin-dashboard">
  <h2 class="text-3xl font-bold text-base-content mb-3">Admin Dashboard</h2>

  <nav class="tabs tabs-boxed bg-base-200 p-1" aria-label="Admin sections">
    <a routerLink="users" class="tab gap-2 rounded-lg" [class.tab-active]="isTabActive('users')">
      <span class="pi pi-users text-sm"></span>
      Users
    </a>
    <a routerLink="roles" class="tab gap-2 rounded-lg" [class.tab-active]="isTabActive('roles')">
      <span class="pi pi-shield text-sm"></span>
      Roles
    </a>
    <a routerLink="permissions" class="tab gap-2 rounded-lg" [class.tab-active]="isTabActive('permissions')">
      <span class="pi pi-lock text-sm"></span>
      Permissions
    </a>
  </nav>
  <div class="admin-content mt-4">
    <router-outlet></router-outlet>
  </div>
</div>
`,
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  constructor(private readonly router: Router) {}

  isTabActive(tab: 'users' | 'roles' | 'permissions'): boolean {
    const url = this.router.url;
    return url === `/admin/${tab}` || url.startsWith(`/admin/${tab}/`);
  }
}
