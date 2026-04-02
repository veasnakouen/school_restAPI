import { CommonModule, NgClass } from '@angular/common';
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

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, NgClass, ReactiveFormsModule],
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.98)' }),
        animate('380ms cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),
    trigger('panelTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('240ms cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [animate('160ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' }))])
    ])
  ],
  template: `
    <div class="hero min-h-screen bg-base-300 bg-gradient-to-br from-base-300 via-base-200 to-base-300" @pageEnter>
      <div class="hero-content flex-col justify-center px-4">
        <!-- Animated background elements -->
        <div class="fixed inset-0 -z-10 overflow-hidden">
          <div class="absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-3xl"></div>
          <div class="absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-secondary/10 blur-3xl" style="animation-delay: 1s;"></div>
          <div class="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-accent/5 blur-3xl" style="animation-delay: 2s;"></div>
        </div>

        <div class="w-full max-w-md mx-auto mt-8">
          <form [formGroup]="activeForm" (ngSubmit)="submitActive()">
            <div class="card w-full shrink-0 bg-base-100/90 backdrop-blur-xl shadow-2xl border border-base-content/10 rounded-3xl p-8">
              <div class="card-body p-0">
                <!-- Logo & Header -->
                <div class="text-center">
                  <h1 class="text-xl font-bold">
                    {{ mode === 'login' ? 'Welcome Back' : 'Create Account' }}
                  </h1>
                  <p class="mt-2 text-xs text-base-content/70">
                    {{
                      mode === 'login'
                        ? 'Sign in to access your school dashboard'
                        : 'Get started with your school workspace'
                    }}
                  </p>
                </div>

                <!-- Toggle Switcher -->
                <div class="mt-6">
                  <div class="relative flex rounded-2xl bg-base-200/50 p-1.5">
                    <!-- Sliding Background -->
                    <div
                      class="absolute top-1.5 h-[calc(100%-0.75rem)] w-[calc(50%-0.375rem)] rounded-xl bg-gradient-to-r from-primary to-secondary shadow-md transition-all duration-300 ease-out"
                      [class.left-1.5]="mode === 'login'"
                      [class.left-[calc(50%+0.1875rem)]]="mode === 'register'"
                    ></div>

                    <!-- Login Button -->
                    <button
                      type="button"
                      class="relative z-10 flex-1 py-2.5 text-xs font-semibold transition-colors duration-300 rounded-xl"
                      [class.text-white]="mode === 'login'"
                      [class.text-base-content/50]="mode !== 'login'"
                      (click)="setMode('login')"
                    >
                      <span class="flex items-center justify-center gap-2">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                        Sign In
                      </span>
                    </button>

                    <!-- Register Button -->
                    <button
                      type="button"
                      class="relative z-10 flex-1 py-2.5 text-xs font-semibold transition-colors duration-300 rounded-xl"
                      [class.text-white]="mode === 'register'"
                      [class.text-base-content/50]="mode !== 'register'"
                      (click)="setMode('register')"
                    >
                      <span class="flex items-center justify-center gap-2">
                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                        Register
                      </span>
                    </button>
                  </div>
                </div>

                <!-- Form Fields -->
                <div class="mt-6 space-y-4">
                  @if (mode === 'register') {
                    <div class="form-control" @panelTransition>
                      <label class="label py-1.5">
                        <span class="label-text text-xs font-semibold">Full Name</span>
                      </label>
                      <div class="relative">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                          <svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        </div>
                        <input
                          type="text"
                          formControlName="fullName"
                          class="input input-bordered w-full rounded-xl pl-10 py-3 text-sm focus:input-primary focus:outline-none transition-all"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                  }

                  <div class="form-control" @panelTransition>
                    <label class="label py-1.5">
                      <span class="label-text text-xs font-semibold">Email Address</span>
                    </label>
                    <div class="relative">
                      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                        </svg>
                      </div>
                      <input
                        type="email"
                        formControlName="email"
                        class="input input-bordered w-full rounded-xl pl-10 py-3 text-sm focus:input-primary focus:outline-none transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div class="form-control" @panelTransition>
                    <label class="label py-1.5">
                      <span class="label-text text-xs font-semibold">Password</span>
                    </label>
                    <div class="relative">
                      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                      </div>
                      <input
                        type="password"
                        formControlName="password"
                        class="input input-bordered w-full rounded-xl pl-10 py-3 text-sm focus:input-primary focus:outline-none transition-all"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  @if (mode === 'register') {
                    <div class="form-control" @panelTransition>
                      <label class="label py-1.5">
                        <span class="label-text text-xs font-semibold">Confirm Password</span>
                      </label>
                      <div class="relative">
                        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                          <svg class="h-4 w-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                          </svg>
                        </div>
                        <input
                          type="password"
                          formControlName="confirmPassword"
                          class="input input-bordered w-full rounded-xl pl-10 py-3 text-sm focus:input-primary focus:outline-none transition-all"
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>
                  }

                  @if (mode === 'register' && registerForm.errors?.['passwordMismatch'] && registerForm.touched) {
                    <div class="alert alert-error border-0 bg-error/10 text-error py-3 rounded-xl">
                      <svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                      <span class="text-xs">Passwords do not match</span>
                    </div>
                  }
                </div>

                <!-- Submit Button -->
                <button
                  class="btn btn-primary mt-6 w-full rounded-xl py-3 text-sm font-semibold border-none shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  [disabled]="activeForm.invalid || busy"
                >
                  @if (busy) {
                    <span class="loading loading-spinner"></span>
                    {{ mode === 'login' ? 'Signing in...' : 'Creating account...' }}
                  } @else {
                    {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
                  }
                </button>

                <!-- Feedback Message -->
                @if (feedbackMessage) {
                  <div
                    class="alert mt-4 border-0 rounded-xl"
                    [class.alert-success]="feedbackTone === 'success'"
                    [class.alert-error]="feedbackTone === 'error'"
                    [ngClass]="{'bg-success/10': feedbackTone === 'success', 'bg-error/10': feedbackTone === 'error'}"
                  >
                    @if (feedbackTone === 'success') {
                      <svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    }
                    @if (feedbackTone === 'error') {
                      <svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                      </svg>
                    }
                    <span class="text-xs">{{ feedbackMessage }}</span>
                  </div>
                }

                <!-- Alternate Mode Link -->
                <div class="flex flex-row items-center justify-center gap-2 mt-6">
                  <span class="text-xs text-base-content/70">
                    {{ mode === 'login' ? "Don't have an account?" : "Already have an account?" }}
                  </span>
                  <button
                    type="button"
                    class="link link-primary font-semibold text-xs"
                    (click)="setMode(mode === 'login' ? 'register' : 'login')"
                  >
                    {{ mode === 'login' ? 'Register' : 'Sign In' }}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <!-- Footer -->
          <p class="mt-6 text-center text-[10px] text-base-content/50">
            &copy; {{ currentYear }} School REST UI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly currentYear = new Date().getFullYear();
  protected mode: AuthMode = 'login';
  protected busy = false;
  protected feedbackMessage = '';
  protected feedbackTone: 'success' | 'error' | '' = '';

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
      next: (message) => {
        this.registerForm.reset({
          fullName: '',
          email,
          password: '',
          confirmPassword: ''
        });
        this.loginForm.patchValue({ email, password: '' });
        this.setMode('login');
        this.feedbackMessage = message || 'Account created successfully. You can sign in now.';
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
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      const response = error as { error?: unknown; message?: string };
      if (typeof response.message === 'string') {
        return response.message;
      }

      if (typeof response.error === 'string') {
        return response.error;
      }

      if (response.error && typeof response.error === 'object') {
        const nested = response.error as { message?: string; errors?: Record<string, string[]> };
        if (typeof nested.message === 'string') {
          return nested.message;
        }

        const firstError = nested.errors ? Object.values(nested.errors).flat().find(Boolean) : undefined;
        if (firstError) {
          return firstError;
        }
      }
    }

    return fallback;
  }
}
