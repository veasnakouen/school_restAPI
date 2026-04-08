import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Component, DestroyRef, HostListener, effect, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, filter, forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../core/services/auth.service';
import { ClassApiService } from '../core/services/class-api.service';
import { ProductApiService } from '../core/services/product-api.service';
import { StudentApiService } from '../core/services/student-api.service';
import { ThemeName, ThemeService } from '../core/services/theme.service';
import { UserPreferencesService } from '../core/services/user-preferences.service';
import { DashboardComponent } from '../features/dashboard/dashboard.component';
import { ClassDto, StudentDto } from '../models/academic.model';
import { ProductDto } from '../models/inventory.model';
import { PagedResult } from '../models/paging.model';
import { UserProfile } from '../models/auth.model';
import { ClickOutsideDirective } from '../shared/directives/click-outside.directive';

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
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DashboardComponent, ClickOutsideDirective],
  animations: [
    trigger('dropdownEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px) scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px) scale(0.95)' }))
      ])
    ])
  ],
  template: `
    <div class="relative min-h-screen overflow-x-clip bg-base-200 text-base-content">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl"></div>
        <div class="absolute right-0 top-24 h-80 w-80 rounded-full bg-secondary/5 blur-3xl"></div>
        <div class="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/5 blur-3xl"></div>
      </div>

      <div class="relative z-10 flex h-screen gap-4 overflow-hidden lg:h-[100dvh]" [ngClass]="preferences.compactMode() ? 'p-3' : 'p-4'" [style.marginRight]="showDataPanel && isLargeScreen ? '26rem' : '0'">

      <aside
        class="app-shell-panel fixed inset-y-4 left-4 z-30 flex h-[calc(100dvh-2rem)] w-72 shrink-0 flex-col transition-transform duration-300"
        [style.transform]="sidebarOpen ? 'translateX(0)' : 'translateX(calc(-100% - 2rem))'"
      >
        <div class="border-b border-base-300/70 px-5 py-5">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg shadow-primary/20">
              <span class="text-lg font-black">S</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-extrabold tracking-wide text-base-content">School REST UI</p>
              <p class="text-[11px] uppercase tracking-[0.35em] text-base-content/50">Operations dashboard</p>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="badge badge-primary badge-outline badge-sm">Live</span>
              <span class="badge badge-ghost badge-sm">{{ theme.themeDisplayName() }}</span>
            </div>
            <span class="text-[11px] font-semibold text-base-content/70">{{ activePageTitle }}</span>
          </div>
        </div>

        <nav class="mt-4 flex-1 overflow-y-auto px-4 pb-4">
          <ul class="space-y-2">
            @for (item of navigationItems; track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg shadow-primary/20"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  [title]="item.description"
                  class="group flex items-start gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-base-content/75 transition hover:border-base-300 hover:bg-base-200/80 hover:text-base-content"
                  (click)="sidebarOpen = false"
                >
                  <span class="pi mt-0.5 text-base text-primary transition group-hover:scale-110 group-hover:text-base-content" [ngClass]="item.icon"></span>
                  <span class="flex-1">
                    <span class="block">{{ item.label }}</span>
                    <span class="mt-0.5 block text-[11px] font-normal text-base-content/50 group-hover:text-base-content/80">{{ item.description }}</span>
                  </span>
                </a>
              </li>
            }
          </ul>
        </nav>


      </aside>

      <!-- OVERLAY (small screens only) -->
      @if ((sidebarOpen || showDataPanel) && !isLargeScreen) {
        <div class="fixed inset-0 z-20 bg-black/60" (click)="closePanels()"></div>
      }

      <div class="flex h-full flex-1 flex-col gap-4 transition-[margin] duration-300"
           [style.marginLeft]="sidebarOpen && isLargeScreen ? '19rem' : '0'">

        <header class="app-shell-panel relative z-20 flex min-h-20 shrink-0 items-center gap-4" [ngClass]="preferences.compactMode() ? 'px-3 py-3' : 'px-4 py-4 lg:px-6'">
          <button class="btn btn-ghost btn-sm" (click)="toggleSidebar()">
            <span class="pi pi-bars text-lg"></span>
          </button>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h1 class="whitespace-nowrap text-base font-extrabold tracking-tight text-base-content">{{ activePageTitle }}</h1>
            </div>
            <p class="truncate text-xs text-base-content/60">{{ activePageDescription }}</p>
          </div>

          <div class="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-full border-0 px-2 py-1 transition"
              (click)="theme.toggle()"
              [attr.aria-label]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
              [attr.title]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
            >
              @if (theme.isDark()) {
                <svg class="h-4 w-4 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
                <svg class="h-4 w-4 text-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"></path>
                </svg>
              }
            </button>

            <div class="relative" (clickOutside)="showThemeMenu = false">
              <button
                type="button"
                class="btn btn-primary btn-sm rounded-full px-4 shadow-lg shadow-primary/20"
                (click)="showThemeMenu = !showThemeMenu"
                [attr.aria-expanded]="showThemeMenu"
                aria-label="Choose theme"
                title="Choose theme"
              >
                <span class="pi pi-palette text-base text-secondary"></span>
                <span class="text-xs font-medium">{{ theme.themeDisplayName() }}</span>
              </button>

              @if (showThemeMenu) {
                <div class="absolute right-0 top-full z-50 mt-3 flex max-h-[65vh] w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[26px] bg-base-100/95 p-2 shadow-2xl backdrop-blur-xl" @dropdownEnter>
                  <div class="flex-none flex items-start justify-between gap-3 border-b border-base-300/70 bg-base-100/95 px-1 pb-2 pt-1 backdrop-blur-xl">
                    <div>
                      <p class="text-xs font-bold text-base-content">Theme library</p>
                      <p class="text-[11px] text-base-content/55">Preview every DaisyUI palette.</p>
                    </div>
                    <span class="badge badge-ghost badge-sm">{{ theme.themes.length }} themes</span>
                  </div>

                  <div class="mt-2 flex-1 min-h-0 overflow-y-auto rounded-[20px] bg-base-200/40 p-1.5">
                    <div class="grid gap-1.5 sm:grid-cols-2">
                      @for (option of theme.themes; track option.id) {
                        <button
                          type="button"
                          class="rounded-[16px] bg-base-200/60 p-1.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-base-200/80 hover:shadow-lg"
                          [ngClass]="theme.themeName() === option.id ? 'bg-primary/10 shadow-lg shadow-primary/10' : ''"
                          (click)="selectTheme(option.id)"
                        >
                          <div [attr.data-theme]="option.id" class="rounded-[14px] bg-base-100 p-2 shadow-sm">
                            <div class="flex items-start justify-between gap-2">
                              <div>
                                <p class="text-[11px] font-semibold text-base-content">{{ option.name }}</p>
                                <p class="text-[8px] uppercase tracking-[0.24em] text-base-content/45">{{ option.id }}</p>
                              </div>
                              @if (theme.themeName() === option.id) {
                                <span class="badge badge-success badge-xs text-[10px] font-semibold">Active</span>
                              }
                            </div>
                            <div class="mt-2 grid grid-cols-4 gap-0.5">
                              <span class="h-1.5 w-1.5 rounded-full bg-base-content"></span>
                              <span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
                              <span class="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                              <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
                            </div>
                          </div>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <button class="btn btn-ghost btn-circle btn-sm hidden sm:inline-flex">
              <span class="pi pi-bell text-base"></span>
            </button>

            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-full border-0 px-2 py-1 transition"
              (click)="toggleDataPanel()"
              [attr.aria-expanded]="showDataPanel"
              aria-label="Toggle data panel"
              title="Toggle data panel"
            >
              <span class="pi pi-database text-base text-accent"></span>
            </button>

            <div class="relative" (clickOutside)="showUserMenu = false">
              <button
                type="button"
                class="avatar placeholder cursor-pointer transition hover:opacity-85"
                (click)="showUserMenu = !showUserMenu"
                [attr.aria-expanded]="showUserMenu"
                aria-label="User menu"
                title="{{ auth.session()?.fullName || 'User' }}"
              >
                <div class="w-10 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-content shadow-md">
                  <span class="text-sm font-bold">{{ (auth.session()?.fullName || 'U').charAt(0).toUpperCase() }}</span>
                </div>
              </button>

              @if (showUserMenu) {
                <div class="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-[22px] border border-base-300/70 bg-base-100/95 shadow-2xl backdrop-blur-xl" @dropdownEnter>
                  <div class="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 px-4 py-4">
                    <div class="flex items-center gap-3">
                      <div class="avatar placeholder shrink-0">
                        <div class="w-12 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-content shadow-md">
                          <span class="text-base font-bold">{{ (auth.session()?.fullName || 'U').charAt(0).toUpperCase() }}</span>
                        </div>
                      </div>
                      <div class="min-w-0">
                        <p class="truncate text-sm font-bold text-base-content">{{ auth.session()?.fullName || 'School User' }}</p>
                        <p class="truncate text-xs text-base-content/60">{{ auth.session()?.email || 'guest' }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="p-2">
                    <a
                      routerLink="/profile"
                      class="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm text-base-content/80 transition hover:bg-base-200 hover:text-base-content"
                      (click)="showUserMenu = false"
                    >
                      <span class="pi pi-user text-base text-primary"></span>
                      <span class="flex-1 text-left">
                        <span class="block font-medium">Profile</span>
                        <span class="block text-[11px] text-base-content/50">Edit your account details</span>
                      </span>
                    </a>
                    <a
                      routerLink="/settings"
                      class="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm text-base-content/80 transition hover:bg-base-200 hover:text-base-content"
                      (click)="showUserMenu = false"
                    >
                      <span class="pi pi-cog text-base text-primary"></span>
                      <span class="flex-1 text-left">
                        <span class="block font-medium">Settings</span>
                        <span class="block text-[11px] text-base-content/50">Adjust appearance and behavior</span>
                      </span>
                    </a>

                    <div class="my-1.5 border-t border-base-300/70"></div>

                    <button
                      type="button"
                      class="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm text-error transition hover:bg-error/10"
                      (click)="logout()"
                    >
                      <span class="pi pi-sign-out text-base"></span>
                      <span class="font-medium">Sign out</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </header>

        <main class="app-shell-panel min-h-0 flex-1 overflow-y-auto" [ngClass]="preferences.compactMode() ? 'p-3 lg:p-4' : 'p-4 lg:p-6'">
          <div class="mx-auto max-w-[1520px]">
            @if (showDashboard) {
              <app-dashboard></app-dashboard>
            } @else {
              <router-outlet></router-outlet>
            }
          </div>
        </main>

        <footer class="app-shell-panel flex shrink-0 items-center justify-center text-xs text-base-content/50" [ngClass]="preferences.compactMode() ? 'px-3 py-1' : 'px-4 py-1.5'">
          <p>@By : IT Mloptapang</p>
        </footer>
      </div>
      </div>

      <aside
        class="app-shell-panel fixed inset-y-4 right-4 z-30 flex h-[calc(100dvh-2rem)] w-[26rem] max-w-[calc(100vw-2rem)] flex-col transition-transform duration-300"
        [style.transform]="showDataPanel ? 'translateX(0)' : 'translateX(calc(100% + 2rem))'"
      >
        <div class="border-b border-base-300/70 px-5 py-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-extrabold tracking-[0.35em] text-base-content/45 uppercase">Live data</p>
              <h2 class="mt-1 text-lg font-black tracking-tight text-base-content">REST API panel</h2>
              <p class="mt-1 text-xs text-base-content/60">Current classes, students, products, and profile data.</p>
            </div>

            <div class="flex items-center gap-1.5">
              <button type="button" class="btn btn-ghost btn-xs" (click)="loadDataPanel()" [disabled]="dataPanelLoading" title="Refresh data">
                <span class="pi pi-refresh text-sm"></span>
              </button>
              <button type="button" class="btn btn-ghost btn-xs" (click)="closeDataPanel()" title="Close panel">
                <span class="pi pi-times text-sm"></span>
              </button>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-base-content/55">
            <span class="badge badge-primary badge-outline badge-sm">{{ dataPanelLoadedAt || 'Waiting for API data' }}</span>
            <span class="badge badge-ghost badge-sm">{{ dataPanelLoading ? 'Loading' : 'Ready' }}</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          @if (dataPanelLoading) {
            <div class="rounded-[24px] border border-base-300/70 bg-base-100/80 p-4">
              <div class="flex items-center gap-3 text-sm text-base-content/60">
                <span class="loading loading-spinner loading-sm text-primary"></span>
                Fetching live data from SchoolAPI...
              </div>
            </div>
          }

          <div class="grid gap-3 sm:grid-cols-3">
            <article class="rounded-[22px] border border-base-300/70 bg-base-100/80 p-4">
              <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Classes</div>
              <div class="mt-2 text-2xl font-black text-base-content">{{ classPanel?.totalCount ?? 0 }}</div>
              <div class="mt-1 text-xs text-base-content/60">Retrieved from Class/classes</div>
            </article>
            <article class="rounded-[22px] border border-base-300/70 bg-base-100/80 p-4">
              <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Students</div>
              <div class="mt-2 text-2xl font-black text-base-content">{{ studentPanel?.totalCount ?? 0 }}</div>
              <div class="mt-1 text-xs text-base-content/60">Retrieved from Student/students</div>
            </article>
            <article class="rounded-[22px] border border-base-300/70 bg-base-100/80 p-4">
              <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Products</div>
              <div class="mt-2 text-2xl font-black text-base-content">{{ productPanel?.totalCount ?? 0 }}</div>
              <div class="mt-1 text-xs text-base-content/60">Retrieved from products</div>
            </article>
          </div>

          <section class="mt-4 rounded-[24px] border border-base-300/70 bg-base-100/80 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Profile</p>
                <h3 class="mt-1 text-base font-bold text-base-content">Signed-in user</h3>
              </div>
              <span class="badge badge-ghost badge-sm">GET /api/auth/profile</span>
            </div>

            <div class="mt-3 space-y-1 text-sm text-base-content/70">
              <p class="font-semibold text-base-content">{{ profilePanel?.fullName || auth.session()?.fullName || 'Unknown user' }}</p>
              <p>{{ profilePanel?.email || auth.session()?.email || 'No email available' }}</p>
              <p class="text-xs text-base-content/55">Phone: {{ profilePanel?.phoneNumber || 'Not set' }}</p>
            </div>
          </section>

          <section class="mt-4 rounded-[24px] border border-base-300/70 bg-base-100/80 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Classes</p>
                <h3 class="mt-1 text-base font-bold text-base-content">Latest results</h3>
              </div>
              <span class="badge badge-ghost badge-sm">{{ classPanel?.items?.length ?? 0 }} rows</span>
            </div>

            <div class="mt-3 space-y-2">
              @for (item of classPanel?.items || []; track item.id) {
                <div class="rounded-[18px] bg-base-200/70 px-3 py-2.5">
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-base-content">{{ item.className }}</p>
                      <p class="text-xs text-base-content/55">{{ item.students.length }} students</p>
                    </div>
                    <span class="text-[11px] text-base-content/50">{{ item.id }}</span>
                  </div>
                </div>
              } @empty {
                <p class="text-sm text-base-content/55">No classes returned from the API.</p>
              }
            </div>
          </section>

          <section class="mt-4 rounded-[24px] border border-base-300/70 bg-base-100/80 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Students</p>
                <h3 class="mt-1 text-base font-bold text-base-content">Latest results</h3>
              </div>
              <span class="badge badge-ghost badge-sm">{{ studentPanel?.items?.length ?? 0 }} rows</span>
            </div>

            <div class="mt-3 space-y-2">
              @for (item of studentPanel?.items || []; track item.id) {
                <div class="rounded-[18px] bg-base-200/70 px-3 py-2.5">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-base-content">{{ item.engFirstName }} {{ item.engLastName }}</p>
                      <p class="text-xs text-base-content/55">{{ item.khFirstName }} {{ item.khLastName }} • {{ item.gender }}</p>
                    </div>
                    <span class="text-[11px] text-base-content/50">{{ item.classId || 'No class' }}</span>
                  </div>
                </div>
              } @empty {
                <p class="text-sm text-base-content/55">No students returned from the API.</p>
              }
            </div>
          </section>

          <section class="mt-4 rounded-[24px] border border-base-300/70 bg-base-100/80 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Products</p>
                <h3 class="mt-1 text-base font-bold text-base-content">Latest results</h3>
              </div>
              <span class="badge badge-ghost badge-sm">{{ productPanel?.items?.length ?? 0 }} rows</span>
            </div>

            <div class="mt-3 space-y-2">
              @for (item of productPanel?.items || []; track item.id) {
                <div class="rounded-[18px] bg-base-200/70 px-3 py-2.5">
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-base-content">{{ item.name }}</p>
                      <p class="text-xs text-base-content/55">{{ item.brandName || 'No brand' }} • {{ item.categoryName || 'No category' }}</p>
                    </div>
                    <span class="text-[11px] text-base-content/50">{{ item.price ?? 'n/a' }}</span>
                  </div>
                </div>
              } @empty {
                <p class="text-sm text-base-content/55">No products returned from the API.</p>
              }
            </div>
          </section>
        </div>
      </aside>
    </div>
  `
})
export class AppShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);
  private readonly classApi = inject(ClassApiService);
  private readonly studentApi = inject(StudentApiService);
  private readonly productApi = inject(ProductApiService);
  protected readonly theme = inject(ThemeService);
  protected readonly preferences = inject(UserPreferencesService);
  private readonly syncSidebarPreference = effect(() => {
    this.preferences.sidebarOpen();

    if (this.isLargeScreen) {
      this.sidebarOpen = this.preferences.sidebarOpen();
    }
  });

  protected readonly navigationItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'pi-home', description: 'Summary and quick access', exact: true },
    { label: 'API Console', path: '/api-console', icon: 'pi-sliders-h', description: 'Direct SchoolAPI interaction' },
    { label: 'Classes', path: '/classes', icon: 'pi-id-card', description: 'Academic class list' },
    { label: 'Students', path: '/students', icon: 'pi-user', description: 'Student records' },
    { label: 'Products', path: '/products', icon: 'pi-box', description: 'Inventory and items' },
    { label: 'Reports', path: '/reports', icon: 'pi-chart-bar', description: 'PDF and Excel exports' }
  ];

  private readonly pageMetadata: Record<string, { title: string; description: string }> = {
    '/profile': {
      title: 'Profile',
      description: 'Review and update your account details'
    },
    '/settings': {
      title: 'Settings',
      description: 'Customize preferences and appearance'
    }
  };

  private readonly LG_BREAKPOINT = 1024;

  protected sidebarOpen = window.innerWidth >= this.LG_BREAKPOINT && this.preferences.sidebarOpen();
  protected isLargeScreen = window.innerWidth >= this.LG_BREAKPOINT;
  protected showThemeMenu = false;
  protected showUserMenu = false;
  protected showDataPanel = false;
  protected activePageTitle = 'Dashboard';
  protected activePageDescription = 'Summary and quick access';
  protected dataPanelLoading = false;
  protected dataPanelLoadedAt = '';
  protected profilePanel: UserProfile | null = null;
  protected classPanel: PagedResult<ClassDto> | null = null;
  protected studentPanel: PagedResult<StudentDto> | null = null;
  protected productPanel: PagedResult<ProductDto> | null = null;

  protected get showDashboard(): boolean {
    return this.router.url === '/' || this.router.url === '/dashboard';
  }

  @HostListener('window:resize')
  onResize(): void {
    const nextIsLargeScreen = window.innerWidth >= this.LG_BREAKPOINT;
    this.isLargeScreen = nextIsLargeScreen;

    if (!nextIsLargeScreen) {
      this.sidebarOpen = false;
      return;
    }

    this.sidebarOpen = this.preferences.sidebarOpen();
  }

  ngOnInit(): void {
    this.updateActiveRoute(this.router.url);
    this.loadDataPanel();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.updateActiveRoute(event.urlAfterRedirects));
  }

  logout(): void {
    this.showUserMenu = false;
    this.auth.logout();
  }

  protected toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;

    if (this.isLargeScreen) {
      this.preferences.update({ sidebarOpen: this.sidebarOpen });
    }
  }

  protected toggleDataPanel(): void {
    this.showDataPanel = !this.showDataPanel;
    if (this.showDataPanel) {
      this.loadDataPanel();
    }
  }

  protected closeDataPanel(): void {
    this.showDataPanel = false;
  }

  protected closePanels(): void {
    this.sidebarOpen = false;
    this.showDataPanel = false;
  }

  protected loadDataPanel(): void {
    this.dataPanelLoading = true;

    forkJoin({
      profile: this.auth.profile().pipe(catchError(() => of(null))),
      classes: this.classApi.list({ pageSize: 5 }).pipe(catchError(() => of(null))),
      students: this.studentApi.list({ pageSize: 5 }).pipe(catchError(() => of(null))),
      products: this.productApi.list({ pageSize: 5 }).pipe(catchError(() => of(null)))
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.profilePanel = result.profile;
          this.classPanel = result.classes;
          this.studentPanel = result.students;
          this.productPanel = result.products;
          this.dataPanelLoadedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          this.dataPanelLoading = false;
        },
        error: () => {
          this.dataPanelLoading = false;
        }
      });
  }

  protected selectTheme(themeId: ThemeName): void {
    this.theme.setTheme(themeId);
    this.showThemeMenu = false;
  }

  private updateActiveRoute(url: string): void {
    const current = this.navigationItems.find((item) => {
      return url === item.path || url.startsWith(`${item.path}/`);
    });

    if (current) {
      this.activePageTitle = current.label;
      this.activePageDescription = current.description;
      return;
    }

    const exactMatch = this.pageMetadata[url];
    if (exactMatch) {
      this.activePageTitle = exactMatch.title;
      this.activePageDescription = exactMatch.description;
    }
  }
}
