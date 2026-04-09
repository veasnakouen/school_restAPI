import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { LandingRoute, UserPreferencesService } from '../../core/services/user-preferences.service';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ScrollAnimateDirective],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section scrollAnimate animateVariant="fade-up" class="overflow-hidden rounded-[34px] border border-base-300/70 bg-base-100/95 shadow-2xl backdrop-blur-xl">
        <div class="grid gap-6 bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-8">
          <div class="space-y-5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-primary badge-outline">Settings</span>
              <span class="badge badge-ghost">{{ theme.themeDisplayName() }}</span>
              <span class="badge badge-ghost">{{ preferences.defaultLandingRoute() }}</span>
            </div>

            <div class="space-y-3">
              <p class="text-xs uppercase tracking-[0.45em] text-base-content/45">Workspace controls</p>
              <h1 class="text-3xl font-black tracking-tight text-base-content sm:text-4xl">Tune the shell for the way you work.</h1>
              <p class="max-w-2xl text-sm text-base-content/65 sm:text-base">
                Appearance changes apply instantly. Layout and notification preferences are saved in your browser and reused the next time you open the app.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <a routerLink="/profile" class="btn btn-primary rounded-full px-5 shadow-lg shadow-primary/20">Open profile</a>
              <a routerLink="/dashboard" class="btn btn-ghost rounded-full border border-base-300/70 px-5">Back to dashboard</a>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <article class="rounded-[24px] border border-base-300/70 bg-base-100/85 p-4 shadow-lg backdrop-blur">
              <div class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Sidebar</div>
              <div class="mt-2 text-lg font-bold text-base-content">{{ preferences.sidebarOpen() ? 'Open by default' : 'Collapsed by default' }}</div>
              <div class="mt-1 text-xs text-base-content/60">Desktop navigation memory</div>
            </article>

            <article class="rounded-[24px] border border-base-300/70 bg-base-100/85 p-4 shadow-lg backdrop-blur">
              <div class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Sidebar Overlay</div>
              <div class="mt-2 text-lg font-bold text-base-content">{{ preferences.sidebarOverlay() ? 'Overlay mode' : 'Push mode' }}</div>
              <div class="mt-1 text-xs text-base-content/60">Mobile behavior {{ preferences.sidebarOverlay() ? '(overlays content)' : '(pushes content)' }}</div>
            </article>

            <article class="rounded-[24px] border border-base-300/70 bg-base-100/85 p-4 shadow-lg backdrop-blur">
              <div class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Notifications</div>
              <div class="mt-2 text-lg font-bold text-base-content">{{ preferences.emailNotifications() ? 'Email on' : 'Email off' }}</div>
              <div class="mt-1 text-xs text-base-content/60">Local alert preferences</div>
            </article>

            <article class="rounded-[24px] border border-base-300/70 bg-base-100/85 p-4 shadow-lg backdrop-blur">
              <div class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Theme</div>
              <div class="mt-2 text-lg font-bold text-base-content">{{ theme.themeLabel() }} mode</div>
              <div class="mt-1 text-xs text-base-content/60">Managed by the shared theme service</div>
            </article>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article scrollAnimate animateVariant="fade-up" animateDelay="70ms" class="app-shell-panel overflow-hidden">
          <div class="card-body gap-5 p-6 lg:p-8">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="text-2xl font-black tracking-tight text-base-content">Appearance</h2>
                <p class="text-sm text-base-content/60">Pick a theme and keep the interface readable.</p>
              </div>
              <span class="badge badge-primary badge-outline">{{ theme.themes.length }} themes</span>
            </div>

            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              @for (option of themePreviewOptions; track option.id) {
                <button
                  type="button"
                  class="rounded-[18px] border border-base-300/70 bg-base-200/70 p-2 text-left transition hover:-translate-y-0.5 hover:bg-base-200"
                  [class.border-primary]="theme.themeName() === option.id"
                  [class.shadow-lg]="theme.themeName() === option.id"
                  [class.shadow-primary/15]="theme.themeName() === option.id"
                  (click)="theme.setTheme(option.id)"
                >
                  <div [attr.data-theme]="option.id" class="rounded-[14px] bg-base-100 p-3">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <div class="text-sm font-semibold text-base-content">{{ option.name }}</div>
                        <div class="text-[10px] uppercase tracking-[0.25em] text-base-content/45">{{ option.id }}</div>
                      </div>
                      @if (theme.themeName() === option.id) {
                        <span class="badge badge-success badge-xs">Active</span>
                      }
                    </div>
                    <div class="mt-3 flex gap-1.5">
                      <span class="h-2 w-2 rounded-full bg-base-content"></span>
                      <span class="h-2 w-2 rounded-full bg-primary"></span>
                      <span class="h-2 w-2 rounded-full bg-secondary"></span>
                      <span class="h-2 w-2 rounded-full bg-accent"></span>
                    </div>
                  </div>
                </button>
              }
            </div>

            <div class="rounded-[26px] border border-base-300/70 bg-base-200/60 p-4">
              <div class="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-base-content/45">All themes</div>
              <div class="grid gap-2 sm:grid-cols-2">
                @for (option of theme.themes; track option.id) {
                  <button
                    type="button"
                    class="flex items-center justify-between rounded-[16px] bg-base-100 px-3 py-2 text-left transition hover:bg-base-200"
                    [class.outline]="theme.themeName() === option.id"
                    [class.outline-primary]="theme.themeName() === option.id"
                    (click)="theme.setTheme(option.id)"
                  >
                    <span>
                      <span class="block text-sm font-medium text-base-content">{{ option.name }}</span>
                      <span class="block text-[10px] uppercase tracking-[0.25em] text-base-content/45">{{ option.id }}</span>
                    </span>
                    @if (theme.themeName() === option.id) {
                      <span class="badge badge-success badge-xs">Current</span>
                    }
                  </button>
                }
              </div>
            </div>
          </div>
        </article>

        <article scrollAnimate animateVariant="fade-up" animateDelay="120ms" class="app-shell-panel overflow-hidden">
          <div class="card-body gap-5 p-6 lg:p-8">
            <div>
              <h2 class="text-2xl font-black tracking-tight text-base-content">Layout and notifications</h2>
              <p class="text-sm text-base-content/60">These choices are stored locally and restored on the next visit.</p>
            </div>

            <form class="space-y-4" [formGroup]="preferencesForm" (ngSubmit)="savePreferences()">
              <label class="flex items-center justify-between gap-4 rounded-[22px] border border-base-300/70 bg-base-200/70 px-4 py-4">
                <div>
                  <div class="font-semibold text-base-content">Keep sidebar open on desktop</div>
                  <div class="text-xs text-base-content/55">Remember the expanded shell layout when you return.</div>
                </div>
                <input type="checkbox" class="toggle toggle-primary" formControlName="sidebarOpen" />
              </label>

              <label class="flex items-center justify-between gap-4 rounded-[22px] border border-base-300/70 bg-base-200/70 px-4 py-4">
                <div>
                  <div class="font-semibold text-base-content">Overlay mode</div>
                  <div class="text-xs text-base-content/55">When enabled, the sidebar will overlay content on mobile screens. When disabled, it pushes content instead.</div>
                </div>
                <input type="checkbox" class="toggle toggle-primary" formControlName="sidebarOverlay" />
              </label>

              <label class="flex items-center justify-between gap-4 rounded-[22px] border border-base-300/70 bg-base-200/70 px-4 py-4">
                <div>
                  <div class="font-semibold text-base-content">Compact shell spacing</div>
                  <div class="text-xs text-base-content/55">Trim the shell padding for a denser workspace.</div>
                </div>
                <input type="checkbox" class="toggle toggle-primary" formControlName="compactMode" />
              </label>

              <label class="flex items-center justify-between gap-4 rounded-[22px] border border-base-300/70 bg-base-200/70 px-4 py-4">
                <div>
                  <div class="font-semibold text-base-content">Email notifications</div>
                  <div class="text-xs text-base-content/55">Track important account updates by email.</div>
                </div>
                <input type="checkbox" class="toggle toggle-primary" formControlName="emailNotifications" />
              </label>

              <label class="flex items-center justify-between gap-4 rounded-[22px] border border-base-300/70 bg-base-200/70 px-4 py-4">
                <div>
                  <div class="font-semibold text-base-content">Desktop notifications</div>
                  <div class="text-xs text-base-content/55">Reserve alerts for browser popups only.</div>
                </div>
                <input type="checkbox" class="toggle toggle-primary" formControlName="desktopNotifications" />
              </label>

              <label class="form-control">
                <div class="label pb-2">
                  <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Default landing page</span>
                </div>
                <select class="select select-bordered select-primary rounded-2xl" formControlName="defaultLandingRoute">
                  @for (option of landingRouteOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </label>

              <div class="flex flex-wrap gap-3 pt-2">
                <button type="submit" class="btn btn-primary rounded-full px-6 shadow-lg shadow-primary/20" [disabled]="preferencesForm.pristine">
                  Save changes
                </button>
                <button type="button" class="btn btn-ghost rounded-full border border-base-300/70 px-6" (click)="resetPreferences()">
                  Reset defaults
                </button>
              </div>
            </form>
          </div>
        </article>
      </section>

      <section scrollAnimate animateVariant="fade-up" animateDelay="180ms" class="app-shell-panel overflow-hidden">
        <div class="card-body gap-4 p-6 lg:p-8">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="text-xl font-black tracking-tight text-base-content">Current snapshot</h3>
              <p class="text-sm text-base-content/60">What will the shell look like the next time you open it?</p>
            </div>
            <span class="badge badge-secondary badge-outline">Auto saved in localStorage</span>
          </div>

          <div class="grid gap-3 md:grid-cols-4">
            <article class="rounded-[22px] bg-base-200/75 p-4">
              <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Theme</div>
              <div class="mt-2 text-lg font-bold text-base-content">{{ theme.themeDisplayName() }}</div>
            </article>

            <article class="rounded-[22px] bg-base-200/75 p-4">
              <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Sidebar</div>
              <div class="mt-2 text-lg font-bold text-base-content">{{ preferences.sidebarOpen() ? 'Expanded' : 'Collapsed' }}</div>
            </article>

            <article class="rounded-[22px] bg-base-200/75 p-4">
              <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Landing</div>
              <div class="mt-2 text-lg font-bold text-base-content">{{ preferences.defaultLandingRoute() }}</div>
            </article>

            <article class="rounded-[22px] bg-base-200/75 p-4">
              <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Density</div>
              <div class="mt-2 text-lg font-bold text-base-content">{{ preferences.compactMode() ? 'Compact' : 'Comfort' }}</div>
            </article>
          </div>
        </div>
      </section>
    </div>
  `
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly theme = inject(ThemeService);
  protected readonly preferences = inject(UserPreferencesService);

  protected readonly preferencesForm = this.fb.nonNullable.group({
    sidebarOpen: [this.preferences.sidebarOpen()],
    sidebarOverlay: [this.preferences.sidebarOverlay()],
    compactMode: [this.preferences.compactMode()],
    emailNotifications: [this.preferences.emailNotifications()],
    desktopNotifications: [this.preferences.desktopNotifications()],
    defaultLandingRoute: [this.preferences.defaultLandingRoute()]
  });

  protected readonly landingRouteOptions: Array<{ value: LandingRoute; label: string; description: string }> = [
    { value: 'dashboard', label: 'Dashboard', description: 'Open the dashboard overview first' },
    { value: 'profile', label: 'Profile', description: 'Jump straight to account details' },
    { value: 'students', label: 'Students', description: 'Start in the student records area' },
    { value: 'reports', label: 'Reports', description: 'Open reporting and exports' },
    { value: 'api-console', label: 'API Console', description: 'Begin in the API console' }
  ];

  protected readonly themePreviewOptions = this.theme.themes.filter((option) => ['light', 'dark', 'forest', 'night', 'cupcake', 'emerald'].includes(option.id));

  protected savePreferences(): void {
    this.preferences.update(this.preferencesForm.getRawValue());
    this.preferencesForm.markAsPristine();
  }

  protected resetPreferences(): void {
    this.preferences.reset();
    this.preferencesForm.reset({
      sidebarOpen: this.preferences.sidebarOpen(),
      sidebarOverlay: this.preferences.sidebarOverlay(),
      compactMode: this.preferences.compactMode(),
      emailNotifications: this.preferences.emailNotifications(),
      desktopNotifications: this.preferences.desktopNotifications(),
      defaultLandingRoute: this.preferences.defaultLandingRoute()
    });
    this.preferencesForm.markAsPristine();
  }
}