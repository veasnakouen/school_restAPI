import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../models/auth.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ScrollAnimateDirective],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section scrollAnimate animateVariant="fade-up" class="overflow-hidden rounded-[34px] border border-base-300/70 bg-base-100/95 shadow-2xl backdrop-blur-xl">
        <div class="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 px-6 py-6 lg:px-8 lg:py-8">
          <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div class="space-y-5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge badge-primary badge-outline">Profile</span>
                <span class="badge badge-ghost">{{ profile?.roles?.length || 0 }} roles</span>
                <span class="badge badge-ghost">{{ profile?.phoneNumberConfirmed ? 'Phone verified' : 'Phone pending' }}</span>
              </div>

              <div class="flex items-center gap-4">
                <div class="avatar placeholder shrink-0">
                  <div class="w-16 rounded-[1.4rem] bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl shadow-primary/20">
                    <span class="text-xl font-black">{{ initial }}</span>
                  </div>
                </div>

                <div class="min-w-0">
                  <p class="text-xs uppercase tracking-[0.45em] text-base-content/45">Account center</p>
                  <h1 class="truncate text-3xl font-black tracking-tight text-base-content sm:text-4xl">
                    {{ profile?.fullName || auth.session()?.fullName || 'School user' }}
                  </h1>
                  <p class="truncate text-sm text-base-content/60">{{ profile?.email || auth.session()?.email || 'No profile loaded yet' }}</p>
                </div>
              </div>

              <p class="max-w-2xl text-sm text-base-content/65 sm:text-base">
                Keep your identity details current so the dashboard, email flows, and account actions stay in sync.
              </p>

              <div class="flex flex-wrap gap-3">
                <a routerLink="/settings" class="btn btn-primary rounded-full px-5 shadow-lg shadow-primary/20">Open settings</a>
                <a routerLink="/dashboard" class="btn btn-ghost rounded-full border border-base-300/70 px-5">Back to dashboard</a>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <article class="rounded-[24px] border border-base-300/70 bg-base-100/85 p-4 shadow-lg backdrop-blur">
                <div class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Access attempts</div>
                <div class="mt-2 text-3xl font-black text-base-content">{{ profile?.accessFailedCount ?? 0 }}</div>
                <div class="mt-1 text-xs text-base-content/60">Recent lockout pressure</div>
              </article>

              <article class="rounded-[24px] border border-base-300/70 bg-base-100/85 p-4 shadow-lg backdrop-blur">
                <div class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Contact</div>
                <div class="mt-2 text-lg font-bold text-base-content">{{ profile?.phoneNumber || 'Unset' }}</div>
                <div class="mt-1 text-xs text-base-content/60">Primary phone number</div>
              </article>

              <article class="rounded-[24px] border border-base-300/70 bg-base-100/85 p-4 shadow-lg backdrop-blur">
                <div class="text-[11px] uppercase tracking-[0.35em] text-base-content/45">Roles</div>
                <div class="mt-2 text-lg font-bold text-base-content">{{ profile?.roles?.length || 0 }}</div>
                <div class="mt-1 text-xs text-base-content/60">Assigned permissions</div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article scrollAnimate animateVariant="fade-up" animateDelay="70ms" class="app-shell-panel overflow-hidden">
          <div class="card-body gap-5 p-6 lg:p-8">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 class="text-2xl font-black tracking-tight text-base-content">Edit profile</h2>
                <p class="text-sm text-base-content/60">Only the name and phone number are editable here.</p>
              </div>

              <button type="button" class="btn btn-ghost btn-sm rounded-full" (click)="loadProfile()" [disabled]="loading">
                <span class="pi pi-refresh text-base"></span>
                <span>Refresh</span>
              </button>
            </div>

            @if (loading) {
              <div class="rounded-[26px] border border-base-300/70 bg-base-200/70 p-5">
                <div class="flex items-center gap-3 text-sm text-base-content/60">
                  <span class="loading loading-spinner loading-sm text-primary"></span>
                  Loading profile information...
                </div>
              </div>
            }

            @if (loadError) {
              <div class="alert alert-error rounded-[24px] border-0 py-4" role="alert">
                <span class="text-sm font-medium">{{ loadError }}</span>
              </div>
            }

            @if (saveMessage) {
              <div class="alert alert-success rounded-[24px] border-0 py-4" role="status">
                <span class="text-sm font-medium">{{ saveMessage }}</span>
              </div>
            }

            <form class="space-y-5" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="form-control sm:col-span-2">
                  <div class="label pb-2">
                    <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Full name</span>
                  </div>
                  <input class="app-input" type="text" formControlName="fullName" placeholder="Your display name" />
                  @if (profileForm.controls.fullName.touched && profileForm.controls.fullName.invalid) {
                    <div class="mt-2 text-xs font-medium text-error">Enter at least 2 characters.</div>
                  }
                </label>

                <label class="form-control sm:col-span-2">
                  <div class="label pb-2">
                    <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Email address</span>
                  </div>
                  <input class="app-input cursor-not-allowed opacity-80" type="email" formControlName="email" readonly />
                  <div class="mt-2 text-xs text-base-content/50">Email comes from your login account.</div>
                </label>

                <label class="form-control sm:col-span-2">
                  <div class="label pb-2">
                    <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Phone number</span>
                  </div>
                  <input class="app-input" type="tel" formControlName="phoneNumber" placeholder="+855 12 345 678" />
                  @if (profileForm.controls.phoneNumber.touched && profileForm.controls.phoneNumber.invalid) {
                    <div class="mt-2 text-xs font-medium text-error">Use digits, spaces, plus, minus, or parentheses.</div>
                  }
                </label>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  class="btn btn-primary rounded-full px-6 shadow-lg shadow-primary/20"
                  [disabled]="saving || loading || profileForm.invalid || profileForm.pristine"
                >
                  @if (saving) {
                    <span class="loading loading-spinner loading-sm"></span>
                    <span>Saving...</span>
                  } @else {
                    <span>Save profile</span>
                  }
                </button>

                <button type="button" class="btn btn-ghost rounded-full border border-base-300/70 px-6" (click)="resetForm()" [disabled]="loading || profileForm.pristine">
                  Reset
                </button>
              </div>
            </form>
          </div>
        </article>

        <aside class="space-y-6">
          <article scrollAnimate animateVariant="fade-up" animateDelay="120ms" class="app-shell-panel overflow-hidden">
            <div class="card-body gap-4 p-6 lg:p-8">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h3 class="text-xl font-black tracking-tight text-base-content">Account status</h3>
                  <p class="text-sm text-base-content/60">The current security snapshot.</p>
                </div>
                <span class="badge badge-primary badge-outline">Live</span>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-[22px] bg-base-200/75 p-4">
                  <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Verified phone</div>
                  <div class="mt-2 text-lg font-bold text-base-content">{{ profile?.phoneNumberConfirmed ? 'Confirmed' : 'Pending' }}</div>
                </div>

                <div class="rounded-[22px] bg-base-200/75 p-4">
                  <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Failed attempts</div>
                  <div class="mt-2 text-lg font-bold text-base-content">{{ profile?.accessFailedCount ?? 0 }}</div>
                </div>

                <div class="rounded-[22px] bg-base-200/75 p-4 sm:col-span-2">
                  <div class="text-[11px] uppercase tracking-[0.3em] text-base-content/45">Roles</div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    @for (role of profile?.roles || []; track role) {
                      <span class="badge badge-secondary badge-outline">{{ role }}</span>
                    }
                    @if (!(profile?.roles?.length)) {
                      <span class="text-sm text-base-content/55">No roles are currently assigned.</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article scrollAnimate animateVariant="fade-up" animateDelay="180ms" class="app-shell-panel overflow-hidden">
            <div class="card-body gap-4 p-6 lg:p-8">
              <div>
                <h3 class="text-xl font-black tracking-tight text-base-content">Quick actions</h3>
                <p class="text-sm text-base-content/60">Keep account tasks one click away.</p>
              </div>

              <div class="grid gap-3">
                <a routerLink="/settings" class="flex items-center justify-between rounded-[22px] bg-base-200/75 px-4 py-4 transition hover:bg-base-200">
                  <div>
                    <div class="font-semibold text-base-content">Open settings</div>
                    <div class="text-xs text-base-content/55">Theme, layout, and notification preferences</div>
                  </div>
                  <span class="pi pi-arrow-right text-base text-primary"></span>
                </a>

                <a routerLink="/reports" class="flex items-center justify-between rounded-[22px] bg-base-200/75 px-4 py-4 transition hover:bg-base-200">
                  <div>
                    <div class="font-semibold text-base-content">Review reports</div>
                    <div class="text-xs text-base-content/55">Jump to reporting tools</div>
                  </div>
                  <span class="pi pi-chart-bar text-base text-primary"></span>
                </a>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);

  protected readonly profileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.pattern(/^[0-9()+\-\s]*$/), Validators.maxLength(20)]]
  });

  protected profile: UserProfile | null = null;
  protected loading = true;
  protected saving = false;
  protected loadError = '';
  protected saveMessage = '';

  protected get initial(): string {
    const name = this.profile?.fullName || this.auth.session()?.fullName || 'U';
    return name.trim().charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  protected loadProfile(): void {
    this.loading = true;
    this.loadError = '';
    this.saveMessage = '';

    this.auth
      .profile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.profileForm.reset({
            fullName: profile.fullName ?? '',
            email: profile.email ?? '',
            phoneNumber: profile.phoneNumber ?? ''
          });
          this.profileForm.markAsPristine();
          this.loading = false;
        },
        error: (error) => {
          this.loadError = this.extractMessage(error, 'Unable to load your profile right now.');
          this.loading = false;
        }
      });
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.loadError = '';
    this.saveMessage = '';

    const { fullName, phoneNumber } = this.profileForm.getRawValue();
    this.auth
      .updateProfile({
        fullName,
        phoneNumber
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.auth.updateSession({ fullName });
          this.saving = false;
          this.profile = {
            ...(this.profile ?? {
              id: this.auth.session()?.userId ?? '',
              email: this.auth.session()?.email ?? '',
              roles: [],
              phoneNumberConfirmed: false,
              accessFailedCount: 0
            }),
            fullName,
            phoneNumber
          };
          this.saveMessage = 'Profile updated successfully.';
          this.profileForm.markAsPristine();
        },
        error: (error) => {
          this.saving = false;
          this.saveMessage = '';
          this.loadError = this.extractMessage(error, 'Unable to save the profile changes.');
        }
      });
  }

  protected resetForm(): void {
    if (!this.profile) {
      return;
    }

    this.profileForm.reset({
      fullName: this.profile.fullName ?? '',
      email: this.profile.email ?? '',
      phoneNumber: this.profile.phoneNumber ?? ''
    });
    this.profileForm.markAsPristine();
    this.saveMessage = '';
    this.loadError = '';
  }

  private extractMessage(error: unknown, fallback: string): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message || fallback;
    }

    if (error && typeof error === 'object') {
      const response = error as { error?: unknown; message?: unknown };
      if (typeof response.message === 'string' && response.message.trim()) {
        return response.message;
      }
      if (typeof response.error === 'string' && response.error.trim()) {
        return response.error;
      }
      if (response.error && typeof response.error === 'object' && 'message' in response.error) {
        const nestedMessage = (response.error as { message?: unknown }).message;
        if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
          return nestedMessage;
        }
      }
    }

    return fallback;
  }
}