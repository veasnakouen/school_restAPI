import { CommonModule } from '@angular/common';
import { DestroyRef, Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  description: string;
  exact?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- ROOT: theme-aware shell using DaisyUI tokens -->
    <div class="flex min-h-screen gap-3 bg-base-200 p-3 text-base-content">

      <!-- SIDE PANEL CARD -->
      <aside
        class="fixed inset-y-3 left-3 z-30 flex w-64 flex-col rounded-2xl border border-base-300 bg-base-100 shadow-xl transition-transform duration-300 lg:relative lg:inset-auto lg:translate-x-0"
        [class.-translate-x-[calc(100%+1.5rem)]]="!sidebarOpen"
        [class.translate-x-0]="sidebarOpen"
      >
        <!-- brand -->
        <div class="flex h-16 shrink-0 items-center gap-3 border-b border-base-300 px-5">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-200">
            <span class="text-base font-black text-primary">S</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-base-content">School REST UI</p>
            <p class="text-[11px] text-base-content/70">Operations dashboard</p>
          </div>
        </div>

        <!-- user card -->
        <div class="mx-3 mt-4 rounded-2xl border border-base-300 bg-base-200 p-3">
          <div class="flex items-center gap-3">
            <div class="avatar placeholder">
              <div class="w-10 rounded-full bg-primary text-primary-content">
                <span class="text-sm font-bold">{{ (auth.session()?.fullName || 'U').charAt(0).toUpperCase() }}</span>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-base-content">{{ auth.session()?.fullName || 'School User' }}</p>
              <p class="truncate text-xs text-base-content/70">{{ auth.session()?.email || 'guest' }}</p>
            </div>
          </div>
        </div>

        <!-- nav menu -->
        <nav class="mt-4 flex-1 overflow-y-auto px-3">
          <ul class="space-y-1">
            @for (item of navigationItems; track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="!bg-primary !text-primary-content"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  [title]="item.description"
                  class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-base-content/80 transition hover:bg-base-300 hover:text-base-content"
                  (click)="sidebarOpen = false"
                >
                  <span class="pi text-base" [ngClass]="item.icon"></span>
                  <span>{{ item.label }}</span>
                </a>
              </li>
            }
          </ul>
        </nav>

        <!-- sidebar footer -->
        <div class="p-3">
          <button
            class="btn btn-primary w-full rounded-xl"
            type="button"
            (click)="logout()"
          >
            Logout
          </button>
        </div>
      </aside>

      <!-- OVERLAY for mobile sidebar -->
      @if (sidebarOpen) {
        <div class="fixed inset-0 z-20 bg-black/60 lg:hidden" (click)="sidebarOpen = false"></div>
      }

      <!-- RIGHT COLUMN: top bar card + main card + footer card -->
      <div class="flex min-h-[calc(100vh-1.5rem)] flex-1 flex-col gap-3">

        <!-- TOP BAR CARD -->
        <header class="flex h-16 shrink-0 items-center gap-4 rounded-2xl border border-base-300 bg-base-100 px-4 shadow-xl lg:px-6">
          <button class="btn btn-ghost btn-sm lg:hidden" (click)="sidebarOpen = !sidebarOpen">
            <span class="pi pi-bars text-lg"></span>
          </button>

          <div class="flex flex-1 items-center gap-2 min-w-0">
            <h1 class="whitespace-nowrap text-sm font-semibold text-base-content">{{ activePageTitle }}</h1>
            <span class="text-base-content/30">/</span>
            <p class="truncate text-xs text-base-content/70">{{ activePageDescription }}</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-primary btn-circle btn-sm shadow-md"
              (click)="theme.toggle()"
              [attr.aria-label]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
              [attr.title]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
            >
              @if (theme.isDark()) {
                <svg class="h-4 w-4 text-primary-content" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="M4.93 4.93l1.41 1.41"></path>
                  <path d="M17.66 17.66l1.41 1.41"></path>
                  <path d="M2 12h2"></path>
                  <path d="M20 12h2"></path>
                  <path d="M6.34 17.66l-1.41 1.41"></path>
                  <path d="M19.07 4.93l-1.41 1.41"></path>
                </svg>
              } @else {
                <svg class="h-4 w-4 text-primary-content" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"></path>
                </svg>
              }
            </button>

            <!-- Bell -->
            <button class="btn btn-ghost btn-circle btn-sm">
              <span class="pi pi-bell text-base"></span>
            </button>

            <!-- Avatar with initials -->
            <div class="avatar placeholder" title="{{ auth.session()?.fullName || 'User' }}">
              <div class="w-9 rounded-full bg-primary text-primary-content">
                <span class="text-sm font-bold">{{ (auth.session()?.fullName || 'U').charAt(0).toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- MAIN CONTENT CARD -->
        <main class="flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl lg:p-6">
          <div class="mx-auto max-w-[1400px]">
            <router-outlet></router-outlet>
          </div>
        </main>

        <!-- FOOTER CARD -->
        <footer class="flex shrink-0 items-center justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3 text-xs text-base-content/70 shadow-xl lg:px-6">
          <p>School REST UI</p>
          <p>{{ activePageTitle }} &bull; {{ auth.session()?.email || 'Guest' }}</p>
        </footer>
      </div>
    </div>
  `
})
export class AppShellComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  protected readonly navigationItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'pi-home', description: 'Summary and quick access', exact: true },
    { label: 'Classes', path: '/classes', icon: 'pi-id-card', description: 'Academic class list' },
    { label: 'Students', path: '/students', icon: 'pi-user', description: 'Student records' },
    { label: 'Products', path: '/products', icon: 'pi-box', description: 'Inventory and items' },
    { label: 'Reports', path: '/reports', icon: 'pi-chart-bar', description: 'PDF and Excel exports' }
  ];

  protected sidebarOpen = false;
  protected activePageTitle = 'Dashboard';
  protected activePageDescription = 'Summary and quick access';

  ngOnInit(): void {
    this.updateActiveRoute(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((event) => this.updateActiveRoute(event.urlAfterRedirects));
  }

  logout(): void {
    this.auth.logout();
  }

  private updateActiveRoute(url: string): void {
    const current = this.navigationItems.find((item) => {
      return url === item.path || url.startsWith(`${item.path}/`);
    });

    if (!current) {
      return;
    }

    this.activePageTitle = current.label;
    this.activePageDescription = current.description;
  }
}
