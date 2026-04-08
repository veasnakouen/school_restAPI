import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { ThemeService, ThemeName } from '../../core/services/theme.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClickOutsideDirective],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
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
    <div class="relative min-h-screen overflow-hidden bg-base-200 text-base-content">
      <div class="pointer-events-none absolute inset-0">
        <div class="animate-blob absolute -left-24 top-8 h-72 w-72 rounded-full bg-primary/12 blur-3xl"></div>
        <div class="animate-blob animation-delay-2000 absolute right-0 top-20 h-80 w-80 rounded-full bg-secondary/10 blur-3xl"></div>
        <div class="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/8 blur-3xl"></div>
        <div class="absolute inset-0 bg-grid-white/[0.05] opacity-40"></div>
      </div>

      <div class="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg shadow-primary/20">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 6.253v13"></path>
                <path d="M12 6.253C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253"></path>
                <path d="M12 6.253C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm font-extrabold tracking-wide text-base-content">School REST UI</p>
              <p class="text-[11px] uppercase tracking-[0.35em] text-base-content/50">Secure access</p>
            </div>
          </div>

          <div class="ml-auto flex items-center gap-2">
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

            <div class="relative" (clickOutside)="closeDropdown()">
              <button
                type="button"
                class="btn btn-primary btn-sm rounded-full px-4 shadow-lg shadow-primary/20"
                (click)="toggleDropdown()"
                [attr.aria-expanded]="showDropdown"
                aria-label="Choose theme"
                title="Choose theme"
              >
                <span class="pi pi-palette text-base text-secondary"></span>
                <span class="text-xs font-medium">{{ themeDisplayName() }}</span>
              </button>

              @if (showDropdown) {
                <div class="absolute right-0 top-full z-50 mt-3 flex max-h-[65vh] w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[26px] bg-base-100/95 p-2 shadow-2xl backdrop-blur-xl" @dropdownEnter>
                  <div class="flex-none flex items-start justify-between gap-3 border-b border-base-300/70 bg-base-100/95 px-1 pb-2 pt-1 backdrop-blur-xl">
                    <div>
                      <p class="text-xs font-bold text-base-content">Theme library</p>
                      <p class="text-[11px] text-base-content/55">Preview every DaisyUI palette.</p>
                    </div>
                    <span class="badge badge-ghost badge-sm">{{ themes.length }} themes</span>
                  </div>

                  <div class="mt-2 flex-1 min-h-0 overflow-y-auto rounded-[20px] bg-base-200/40 p-1.5">
                    <div class="grid gap-1.5 sm:grid-cols-2">
                      @for (theme of themes; track theme.id) {
                        <button
                          type="button"
                          class="rounded-[16px] bg-base-200/60 p-1.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-base-200/80 hover:shadow-lg"
                          [ngClass]="currentTheme === theme.id ? 'bg-primary/10 shadow-lg shadow-primary/10' : ''"
                          (click)="selectTheme(theme.id)"
                        >
                          <div [attr.data-theme]="theme.id" class="rounded-[14px] bg-base-100 p-2 shadow-sm">
                            <div class="flex items-start justify-between gap-2">
                              <div>
                                <p class="text-[11px] font-semibold text-base-content">{{ theme.name }}</p>
                                <p class="text-[8px] uppercase tracking-[0.24em] text-base-content/45">{{ theme.id }}</p>
                              </div>
                              @if (currentTheme === theme.id) {
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
          </div>
        </header>

        <main class="flex flex-1 items-center justify-center py-6 sm:py-10">
          <section class="w-full max-w-[34rem] overflow-hidden rounded-[34px] border border-base-300/70 bg-base-100/95 shadow-2xl backdrop-blur">
            <div class="border-b border-base-300/70 bg-gradient-to-r from-primary/8 via-secondary/8 to-accent/8 px-6 py-5 sm:px-8">
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-2">
                  <p class="text-xs uppercase tracking-[0.45em] text-base-content/45">Secure access</p>
                  <h1 class="text-3xl font-black tracking-tight text-base-content sm:text-4xl">
                    {{ mode === 'login' ? 'Welcome back' : 'Create your account' }}
                  </h1>
                  <p class="text-sm text-base-content/65">
                    {{ mode === 'login' ? 'Sign in to continue to PrimeLand.' : 'Register once and keep everything in sync.' }}
                  </p>
                </div>
              </div>
            </div>

            <form class="space-y-6 p-6 sm:p-8" [formGroup]="activeForm" (ngSubmit)="submitActive()">
              <div class="rounded-[28px] border border-base-300/70 bg-base-200/70 p-1.5 shadow-inner">
                <div class="relative flex">
                  <span class="absolute inset-y-0 left-0 w-1/2 rounded-[22px] bg-gradient-to-r from-primary to-secondary shadow-lg transition-transform duration-500" [class.translate-x-full]="mode === 'register'"></span>

                  <button
                    type="button"
                    class="relative z-10 flex-1 rounded-[22px] px-4 py-3 text-sm font-bold transition-colors duration-300"
                    [class.text-primary-content]="mode === 'login'"
                    [class.text-base-content/60]="mode !== 'login'"
                    (click)="setMode('login')"
                  >
                    Sign in
                  </button>

                  <button
                    type="button"
                    class="relative z-10 flex-1 rounded-[22px] px-4 py-3 text-sm font-bold transition-colors duration-300"
                    [class.text-primary-content]="mode === 'register'"
                    [class.text-base-content/60]="mode !== 'register'"
                    (click)="setMode('register')"
                  >
                    Register
                  </button>
                </div>
              </div>

              <div class="space-y-4">
                @if (mode === 'register') {
                  <div class="grid gap-4 sm:grid-cols-2" @fadeIn>
                    <label class="form-control sm:col-span-2">
                      <div class="label pb-2">
                        <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Full Name</span>
                      </div>
                      <input type="text" formControlName="fullName" autocomplete="name" class="app-input" placeholder="John Doe" />
                    </label>

                    <label class="form-control sm:col-span-2">
                      <div class="label pb-2">
                        <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Email Address</span>
                      </div>
                      <input type="email" formControlName="email" autocomplete="email" class="app-input" placeholder="you@example.com" />
                    </label>

                    <label class="form-control">
                      <div class="label pb-2">
                        <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Password</span>
                      </div>
                      <input type="password" formControlName="password" autocomplete="new-password" class="app-input" placeholder="At least 8 characters" />
                    </label>

                    <label class="form-control">
                      <div class="label pb-2">
                        <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Confirm Password</span>
                      </div>
                      <input type="password" formControlName="confirmPassword" autocomplete="new-password" class="app-input" placeholder="Repeat password" />
                    </label>
                  </div>
                } @else {
                  <div class="space-y-4" @fadeIn>
                    <label class="form-control">
                      <div class="label pb-2">
                        <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Email Address</span>
                      </div>
                      <input type="email" formControlName="email" autocomplete="username" class="app-input" placeholder="you@example.com" />
                    </label>

                    <label class="form-control">
                      <div class="label pb-2">
                        <span class="label-text text-xs font-bold uppercase tracking-[0.3em] text-base-content/55">Password</span>
                      </div>
                      <input type="password" formControlName="password" autocomplete="current-password" class="app-input" placeholder="••••••••" />
                    </label>
                  </div>
                }

                @if (mode === 'register' && registerForm.errors?.['passwordMismatch'] && registerForm.touched) {
                  <div class="alert alert-error rounded-[22px] border-0 py-3" @fadeIn>
                    <svg class="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm font-medium">Passwords do not match.</span>
                  </div>
                }
              </div>

              <button
                class="btn btn-primary w-full rounded-2xl border-0 py-4 text-sm font-bold uppercase tracking-[0.28em] shadow-lg shadow-primary/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                [disabled]="(mode === 'login' && loginForm.invalid) || (mode === 'register' && registerForm.invalid) || busy"
              >
                @if (busy) {
                  <span class="flex items-center gap-3">
                    <span class="loading loading-spinner loading-sm"></span>
                    {{ mode === 'login' ? 'Signing in...' : 'Creating account...' }}
                  </span>
                } @else {
                  {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
                }
              </button>

              @if (feedbackMessage) {
                <div class="alert rounded-[22px] border-0" [class.alert-success]="feedbackTone === 'success'" [class.alert-error]="feedbackTone === 'error'" @fadeIn>
                  <span class="text-sm font-medium">{{ feedbackMessage }}</span>
                </div>
              }

              <div class="flex flex-wrap items-center justify-center gap-2 text-sm text-base-content/60">
                <span>{{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}</span>
                <button type="button" class="font-bold text-primary underline-offset-4 transition hover:underline" (click)="setMode(mode === 'login' ? 'register' : 'login')">
                  {{ mode === 'login' ? 'Register' : 'Sign in' }}
                </button>
              </div>
            </form>
          </section>
        </main>

        <p class="pb-4 text-center text-xs text-base-content/45">&copy; {{ currentYear }} School REST UI</p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly themeService = inject(ThemeService);
  protected readonly theme = this.themeService;

  protected readonly currentYear = new Date().getFullYear();
  protected readonly themes = this.themeService.themes;
  protected readonly themeDisplayName = this.themeService.themeDisplayName;
  protected readonly themeModeLabel = this.themeService.themeLabel;
  protected showDropdown = false;
  protected mode: AuthMode = 'login';
  protected busy = false;
  protected feedbackMessage = '';
  protected feedbackTone: 'success' | 'error' | '' = '';

  protected get currentTheme(): ThemeName {
    return this.themeService.themeName();
  }

  private readonly passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  };

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly registerForm = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: [this.passwordsMatchValidator] }
  );

  protected get activeForm() {
    return this.mode === 'login' ? this.loginForm : this.registerForm;
  }

  protected toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  protected closeDropdown(): void {
    this.showDropdown = false;
  }

  protected selectTheme(themeId: ThemeName): void {
    this.themeService.setTheme(themeId);
    this.closeDropdown();
  }

  protected setMode(mode: AuthMode): void {
    this.mode = mode;
    this.busy = false;
    this.feedbackMessage = '';
    this.feedbackTone = '';
  }

  protected submitActive(): void {
    if (this.mode === 'login') {
      this.submitLogin();
      return;
    }
    this.submitRegister();
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.busy = true;
    this.feedbackMessage = '';
    this.feedbackTone = '';

    this.auth.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.feedbackMessage = this.extractMessage(error, 'Login failed.');
        this.feedbackTone = 'error';
        this.busy = false;
      },
      complete: () => {
        this.busy = false;
      }
    });
  }

  protected submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.busy = true;
    this.feedbackMessage = '';
    this.feedbackTone = '';

    const { fullName, email, password } = this.registerForm.getRawValue();

    this.auth.register({ fullName, email, password, roles: ['User'] }).subscribe({
      next: () => {
        this.registerForm.reset({ fullName: '', email, password: '', confirmPassword: '' });
        this.loginForm.patchValue({ email, password: '' });
        this.setMode('login');
        this.feedbackMessage = 'Account created successfully. You can sign in now.';
        this.feedbackTone = 'success';
      },
      error: (error) => {
        this.feedbackMessage = this.extractMessage(error, 'Registration failed.');
        this.feedbackTone = 'error';
      },
      complete: () => {
        this.busy = false;
      }
    });
  }

  private extractMessage(error: unknown, fallback: string): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const response = error as { error?: unknown; message?: string };
      if (typeof response.message === 'string') return response.message;
      if (typeof response.error === 'string') return response.error;
    }
    return fallback;
  }
}
