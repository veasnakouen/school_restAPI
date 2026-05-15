import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface NavItem {
  label: string;
  icon: string;
  routerLink: string;
}

const TEMPLATE = `
<div class="px-3 pb-3 max-w-5xl mx-auto">
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-base-content">Admin Dashboard</h2>
    <p class="text-base-content/60 text-sm mt-0.5">Manage users, roles, and system configuration.</p>
  </div>

  <!-- Tab Navigation (DaisyUI) -->
  <nav class="tabs tabs-boxed bg-base-200 p-1 mb-6 inline-flex" aria-label="Admin sections">
    <a *ngFor="let item of items" 
       [routerLink]="item.routerLink" 
       class="tab gap-2 rounded-lg" 
       [class.tab-active]="activeItem?.routerLink === item.routerLink"
       (click)="onTabChange(item)">
      <i [class]="item.icon"></i>
      {{ item.label }}
    </a>
  </nav>

  <!-- Content injected via router (e.g., app-user-management) -->
  <div class="mt-4">
    <router-outlet></router-outlet>
  </div>
</div>
`;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: TEMPLATE
})
export class AdminComponent {
  items: NavItem[] = [];
  activeItem: NavItem | undefined;

  constructor(private router: Router) {
    this.items = [
      { label: 'Users', icon: 'pi pi-users', routerLink: '/admin/users' },
      { label: 'Roles', icon: 'pi pi-shield', routerLink: '/admin/roles' },
      { label: 'Settings', icon: 'pi pi-cog', routerLink: '/admin/settings' },
      { label: 'Transactions', icon: 'pi pi-history', routerLink: '/admin/transactions' }
    ];

    // Keep active tab synced with current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.activeItem = this.items.find(item => item.routerLink && this.router.url.includes(item.routerLink));
    });
    
    // Set initial active item
    this.activeItem = this.items.find(item => item.routerLink && this.router.url.includes(item.routerLink)) ?? this.items[0];
  }

  onTabChange(item: NavItem) {
    this.activeItem = item;
  }
}