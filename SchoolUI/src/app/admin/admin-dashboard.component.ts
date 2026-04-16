import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  constructor(private readonly router: Router) {}

  isTabActive(tab: 'users' | 'roles' | 'permissions'): boolean {
    const url = this.router.url;
    return url === `/admin/${tab}` || url.startsWith(`/admin/${tab}/`);
  }
}
