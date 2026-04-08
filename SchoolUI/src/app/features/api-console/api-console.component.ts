import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ClassApiService } from '../../core/services/class-api.service';
import { LookupService } from '../../core/services/lookup.service';
import { ProductApiService } from '../../core/services/product-api.service';
import { ReportApiService } from '../../core/services/report-api.service';
import { StudentApiService } from '../../core/services/student-api.service';
import { ClassDto, CreateClassRequest, CreateStudentRequest, Gender, StudentDto } from '../../models/academic.model';
import { LookupOption } from '../../models/lookup.model';
import { CreateProductRequest, ProductDto } from '../../models/inventory.model';

interface ActivityEntry {
  tone: 'success' | 'error' | 'info';
  message: string;
  time: string;
}

@Component({
  selector: 'app-api-console',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ScrollAnimateDirective],
  template: `
    <div class="space-y-6">
      <section scrollAnimate animateVariant="fade-up" animateDelay="0ms" class="overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary via-secondary to-accent text-primary-content shadow-2xl">
        <div class="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:p-8">
          <div class="space-y-5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge border-primary-content/20 bg-primary-content/10 text-primary-content">API Console</span>
              <span class="badge border-primary-content/20 bg-primary-content/10 text-primary-content/80">SchoolAPI</span>
              <span class="badge border-primary-content/20 bg-primary-content/10 text-primary-content/80">Live forms</span>
            </div>

            <div class="space-y-3">
              <p class="text-xs uppercase tracking-[0.45em] text-primary-content/70">Interact with the backend</p>
              <h1 class="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                Create, search, delete, and export data from one polished workspace.
              </h1>
              <p class="max-w-3xl text-sm text-primary-content/80 sm:text-base">
                This page connects directly to the SchoolAPI controllers for classes, students, products, and reports.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <a routerLink="/dashboard" class="btn border-0 bg-white text-base-content shadow-lg hover:bg-white/95">Dashboard</a>
              <a routerLink="/classes" class="btn btn-ghost border border-primary-content/20 text-primary-content hover:bg-primary-content/10">Classes</a>
              <a routerLink="/students" class="btn btn-ghost border border-primary-content/20 text-primary-content hover:bg-primary-content/10">Students</a>
              <a routerLink="/products" class="btn btn-ghost border border-primary-content/20 text-primary-content hover:bg-primary-content/10">Products</a>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div class="rounded-[28px] bg-primary-content/10 p-5 backdrop-blur">
              <div class="text-xs uppercase tracking-[0.35em] text-primary-content/65">Session</div>
              <div class="mt-2 text-2xl font-black text-primary-content">{{ auth.session()?.fullName || 'Guest' }}</div>
              <div class="mt-1 text-sm text-primary-content/75">{{ auth.session()?.email || 'Not signed in' }}</div>
            </div>
            <div class="rounded-[28px] bg-primary-content/10 p-5 backdrop-blur">
              <div class="text-xs uppercase tracking-[0.35em] text-primary-content/65">Loaded records</div>
              <div class="mt-2 text-2xl font-black text-primary-content">
                {{ classes.length + students.length + products.length }}
              </div>
              <div class="mt-1 text-sm text-primary-content/75">Across the active console</div>
            </div>
          </div>
        </div>
      </section>

      <section scrollAnimate animateVariant="fade-up" animateDelay="80ms" class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article class="app-shell-panel space-y-5 p-5 lg:p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge badge-primary badge-outline">Academics</span>
                <span class="badge badge-ghost">{{ classes.length }} classes</span>
                <span class="badge badge-ghost">{{ students.length }} students</span>
              </div>
              <h2 class="section-title mt-3 text-base-content">Classes and students</h2>
              <p class="mt-2 max-w-2xl text-sm text-base-content/65">Create school classes and students, then manage them from the tables below.</p>
            </div>

            <button class="btn btn-outline btn-sm rounded-full" type="button" (click)="refreshAcademic()">Refresh data</button>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <form class="space-y-4 rounded-[26px] border border-base-300/70 bg-base-100/70 p-4 shadow-lg" [formGroup]="classForm" (ngSubmit)="createClass()">
              <div>
                <h3 class="text-xl font-bold text-base-content">Create class</h3>
                <p class="text-sm text-base-content/60">POST /api/Class/classes</p>
              </div>

              <label class="form-control w-full">
                <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Class name</span></div>
                <input class="app-input" formControlName="className" placeholder="Class 7A" />
              </label>

              <button class="btn btn-primary w-full rounded-full" type="submit" [disabled]="classForm.invalid || busyClass">
                @if (busyClass) {
                  <span class="loading loading-spinner loading-sm"></span>
                  Saving class...
                } @else {
                  Save class
                }
              </button>
            </form>

            <form class="space-y-4 rounded-[26px] border border-base-300/70 bg-base-100/70 p-4 shadow-lg" [formGroup]="studentForm" (ngSubmit)="createStudent()">
              <div>
                <h3 class="text-xl font-bold text-base-content">Create student</h3>
                <p class="text-sm text-base-content/60">POST /api/Student/students</p>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Kh first name</span></div>
                  <input class="app-input" formControlName="khFirstName" placeholder="ឈ្មោះ" />
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Kh last name</span></div>
                  <input class="app-input" formControlName="khLastName" placeholder="ត្រកូល" />
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Eng first name</span></div>
                  <input class="app-input" formControlName="engFirstName" placeholder="First name" />
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Eng last name</span></div>
                  <input class="app-input" formControlName="engLastName" placeholder="Last name" />
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Gender</span></div>
                  <select class="select select-bordered rounded-2xl" formControlName="gender">
                    @for (gender of genderOptions; track gender) {
                      <option [value]="gender">{{ gender }}</option>
                    }
                  </select>
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Date of birth</span></div>
                  <input class="app-input" type="date" formControlName="dateOfBirth" />
                </label>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Class</span></div>
                  <select class="select select-bordered rounded-2xl" formControlName="classId">
                    <option value="">Select class</option>
                    @for (item of classOptions; track item.value) {
                      <option [value]="item.value">{{ item.label }}</option>
                    }
                  </select>
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Outreach</span></div>
                  <select class="select select-bordered rounded-2xl" formControlName="outReachId">
                    <option value="">Select outreach</option>
                    @for (item of outreachOptions; track item.value) {
                      <option [value]="item.value">{{ item.label }}</option>
                    }
                  </select>
                </label>
              </div>

              <button class="btn btn-secondary w-full rounded-full" type="submit" [disabled]="studentForm.invalid || busyStudent">
                @if (busyStudent) {
                  <span class="loading loading-spinner loading-sm"></span>
                  Saving student...
                } @else {
                  Save student
                }
              </button>
            </form>
          </div>

          <div class="grid gap-4 xl:grid-cols-2">
            <div class="overflow-hidden rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg">
              <div class="flex items-center justify-between border-b border-base-300/70 px-4 py-3">
                <div>
                  <div class="font-bold text-base-content">Classes</div>
                  <div class="text-xs text-base-content/60">GET /api/Class/classes</div>
                </div>
                <button class="btn btn-ghost btn-xs" type="button" (click)="loadClasses()">Reload</button>
              </div>
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of classes; track item.id) {
                      <tr>
                        <td class="font-medium">{{ item.className }}</td>
                        <td class="font-mono text-xs text-base-content/60">{{ item.id }}</td>
                        <td class="text-right">
                          <button class="btn btn-ghost btn-xs text-error" type="button" (click)="deleteClass(item.id)">Delete</button>
                        </td>
                      </tr>
                    } @empty {
                      <tr><td colspan="3" class="py-8 text-center text-base-content/60">No classes loaded.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="overflow-hidden rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg">
              <div class="flex items-center justify-between border-b border-base-300/70 px-4 py-3">
                <div>
                  <div class="font-bold text-base-content">Students</div>
                  <div class="text-xs text-base-content/60">GET /api/Student/students</div>
                </div>
                <button class="btn btn-ghost btn-xs" type="button" (click)="loadStudents()">Reload</button>
              </div>
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Class</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of students; track item.id) {
                      <tr>
                        <td>
                          <div class="font-medium">{{ item.engFirstName }} {{ item.engLastName }}</div>
                          <div class="text-xs text-base-content/60">{{ item.gender }} • {{ item.dateOfBirth | date:'mediumDate' }}</div>
                        </td>
                        <td class="font-mono text-xs text-base-content/60">{{ item.classId || '-' }}</td>
                        <td class="text-right">
                          <button class="btn btn-ghost btn-xs text-error" type="button" (click)="deleteStudent(item.id)">Delete</button>
                        </td>
                      </tr>
                    } @empty {
                      <tr><td colspan="3" class="py-8 text-center text-base-content/60">No students loaded.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </article>

        <article class="space-y-6">
          <section class="app-shell-panel space-y-5 p-5 lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="badge badge-primary badge-outline">Inventory</span>
                  <span class="badge badge-ghost">{{ products.length }} products</span>
                </div>
                <h2 class="section-title mt-3 text-base-content">Products</h2>
                <p class="mt-2 max-w-2xl text-sm text-base-content/65">Create inventory items and refresh them from the API.
                </p>
              </div>
              <button class="btn btn-outline btn-sm rounded-full" type="button" (click)="refreshProducts()">Refresh data</button>
            </div>

            <form class="grid gap-4 rounded-[26px] border border-base-300/70 bg-base-100/70 p-4 shadow-lg" [formGroup]="productForm" (ngSubmit)="createProduct()">
              <div class="grid gap-3 md:grid-cols-2">
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Name</span></div>
                  <input class="app-input" formControlName="name" placeholder="Projector" />
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Code number</span></div>
                  <input class="app-input" formControlName="codeNumber" placeholder="PRD-001" />
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Category</span></div>
                  <select class="select select-bordered rounded-2xl" formControlName="categoryId">
                    <option value="">Select category</option>
                    @for (item of categoryOptions; track item.value) {
                      <option [value]="item.value">{{ item.label }}</option>
                    }
                  </select>
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Brand</span></div>
                  <select class="select select-bordered rounded-2xl" formControlName="brandId">
                    <option value="">Select brand</option>
                    @for (item of brandOptions; track item.value) {
                      <option [value]="item.value">{{ item.label }}</option>
                    }
                  </select>
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Price</span></div>
                  <input class="app-input" type="number" formControlName="price" placeholder="1200" />
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Quality</span></div>
                  <input class="app-input" formControlName="quality" placeholder="New / Used" />
                </label>
              </div>

              <label class="form-control w-full">
                <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Description</span></div>
                <textarea class="textarea textarea-bordered min-h-28 rounded-2xl" formControlName="description" placeholder="Optional product description"></textarea>
              </label>

              <div class="grid gap-3 md:grid-cols-[1fr_auto]">
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Voucher number</span></div>
                  <input class="app-input" formControlName="voucherNumber" placeholder="VCH-1001" />
                </label>
                <div class="flex items-end">
                  <button class="btn btn-primary rounded-full px-6" type="submit" [disabled]="productForm.invalid || busyProduct">
                    @if (busyProduct) {
                      <span class="loading loading-spinner loading-sm"></span>
                      Saving product...
                    } @else {
                      Save product
                    }
                  </button>
                </div>
              </div>
            </form>

            <div class="overflow-hidden rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg">
              <div class="flex items-center justify-between border-b border-base-300/70 px-4 py-3">
                <div>
                  <div class="font-bold text-base-content">Products</div>
                  <div class="text-xs text-base-content/60">GET /api/products</div>
                </div>
                <button class="btn btn-ghost btn-xs" type="button" (click)="loadProducts()">Reload</button>
              </div>
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Brand</th>
                      <th>Category</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of products; track item.id ?? item.name) {
                      <tr>
                        <td>
                          <div class="font-medium">{{ item.name }}</div>
                          <div class="text-xs text-base-content/60">{{ item.codeNumber || '-' }}</div>
                        </td>
                        <td>{{ item.brandName || '-' }}</td>
                        <td>{{ item.categoryName || '-' }}</td>
                        <td class="text-right">
                          <button class="btn btn-ghost btn-xs text-error" type="button" (click)="deleteProduct(item.id || '')">Delete</button>
                        </td>
                      </tr>
                    } @empty {
                      <tr><td colspan="4" class="py-8 text-center text-base-content/60">No products loaded.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="app-shell-panel space-y-5 p-5 lg:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="badge badge-secondary badge-outline">Reports</span>
                  <span class="badge badge-ghost">Exports</span>
                </div>
                <h2 class="section-title mt-3 text-base-content">Monthly reports</h2>
                <p class="mt-2 max-w-2xl text-sm text-base-content/65">Generate PDF, Excel, or queue the monthly transaction report.</p>
              </div>
            </div>

            <form class="grid gap-4 rounded-[26px] border border-base-300/70 bg-base-100/70 p-4 shadow-lg" [formGroup]="reportForm" (ngSubmit)="downloadMonthlyPdf()">
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Year</span></div>
                  <input class="app-input" type="number" formControlName="year" />
                </label>
                <label class="form-control w-full">
                  <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Month</span></div>
                  <input class="app-input" type="number" formControlName="month" />
                </label>
              </div>

              <div class="flex flex-wrap gap-3">
                <button class="btn btn-primary rounded-full" type="button" (click)="downloadMonthlyPdf()">PDF</button>
                <button class="btn btn-outline rounded-full" type="button" (click)="downloadMonthlyExcel()">Excel</button>
                <button class="btn btn-secondary rounded-full" type="button" (click)="queueMonthly()">Queue job</button>
              </div>
            </form>
          </section>
        </article>
      </section>

      <section scrollAnimate animateVariant="fade-up" animateDelay="160ms" class="app-shell-panel space-y-4 p-5 lg:p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-accent badge-outline">Activity</span>
              <span class="badge badge-ghost">Live feedback</span>
            </div>
            <h2 class="section-title mt-3 text-base-content">Recent actions</h2>
          </div>
          <div class="text-sm text-base-content/60">{{ statusMessage }}</div>
        </div>

        <div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          @for (entry of activityLog; track entry.time + entry.message) {
            <div class="rounded-[22px] border border-base-300/70 bg-base-100/70 p-4 shadow-sm" [class.border-success/40]="entry.tone === 'success'" [class.border-error/40]="entry.tone === 'error'" [class.border-info/40]="entry.tone === 'info'">
              <div class="flex items-center justify-between gap-3">
                <span class="badge" [class.badge-success]="entry.tone === 'success'" [class.badge-error]="entry.tone === 'error'" [class.badge-info]="entry.tone === 'info'">{{ entry.tone }}</span>
                <span class="text-[11px] text-base-content/50">{{ entry.time }}</span>
              </div>
              <p class="mt-3 text-sm text-base-content/75">{{ entry.message }}</p>
            </div>
          } @empty {
            <div class="rounded-[22px] border border-dashed border-base-300/70 bg-base-100/60 p-6 text-sm text-base-content/60">No actions yet. Create a class, student, or product to see live API feedback here.</div>
          }
        </div>
      </section>
    </div>
  `
})
export class ApiConsoleComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);
  private readonly lookup = inject(LookupService);
  private readonly classApi = inject(ClassApiService);
  private readonly studentApi = inject(StudentApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly reportApi = inject(ReportApiService);

  protected readonly genderOptions: Gender[] = ['Female', 'Male', 'Other'];

  protected readonly classForm = this.fb.nonNullable.group({
    className: ['', [Validators.required, Validators.minLength(2)]]
  });

  protected readonly studentForm = this.fb.nonNullable.group({
    khFirstName: ['', [Validators.required]],
    khLastName: ['', [Validators.required]],
    engFirstName: ['', [Validators.required]],
    engLastName: ['', [Validators.required]],
    gender: ['Male' as Gender, [Validators.required]],
    dateOfBirth: ['', [Validators.required]],
    classId: [''],
    outReachId: ['']
  });

  protected readonly productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    codeNumber: [''],
    description: [''],
    categoryId: [''],
    brandId: [''],
    price: [''],
    quality: [''],
    voucherNumber: ['']
  });

  protected readonly reportForm = this.fb.nonNullable.group({
    year: [new Date().getFullYear().toString(), [Validators.required]],
    month: [(new Date().getMonth() + 1).toString(), [Validators.required]]
  });

  protected classes: ClassDto[] = [];
  protected students: StudentDto[] = [];
  protected products: ProductDto[] = [];
  protected classOptions: LookupOption[] = [];
  protected outreachOptions: LookupOption[] = [];
  protected brandOptions: LookupOption[] = [];
  protected categoryOptions: LookupOption[] = [];
  protected activityLog: ActivityEntry[] = [];
  protected statusMessage = 'Ready to call SchoolAPI.';
  protected statusTone: 'success' | 'error' | 'info' = 'info';
  protected busyClass = false;
  protected busyStudent = false;
  protected busyProduct = false;

  ngOnInit(): void {
    this.refreshAll();
  }

  protected refreshAcademic(): void {
    this.loadLookups();
    this.loadClasses();
    this.loadStudents();
  }

  protected refreshProducts(): void {
    this.loadLookups();
    this.loadProducts();
  }

  protected createClass(): void {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    this.busyClass = true;
    const payload: CreateClassRequest = {
      className: this.classForm.getRawValue().className.trim()
    };

    this.classApi.create(payload).subscribe({
      next: (created) => {
        this.classForm.reset({ className: '' });
        this.loadClasses();
        this.loadLookups();
        this.announce(`Created class ${created.className}.`, 'success');
        this.busyClass = false;
      },
      error: (error) => {
        this.announce(this.extractMessage(error, 'Failed to create class.'), 'error');
        this.busyClass = false;
      }
    });
  }

  protected deleteClass(id: string): void {
    this.classApi.delete(id).subscribe({
      next: () => {
        this.loadClasses();
        this.loadLookups();
        this.announce('Class deleted.', 'success');
      },
      error: (error) => this.announce(this.extractMessage(error, 'Failed to delete class.'), 'error')
    });
  }

  protected createStudent(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.busyStudent = true;
    const value = this.studentForm.getRawValue();
    const payload: CreateStudentRequest = {
      khFirstName: value.khFirstName.trim(),
      khLastName: value.khLastName.trim(),
      engFirstName: value.engFirstName.trim(),
      engLastName: value.engLastName.trim(),
      gender: value.gender,
      dateOfBirth: new Date(value.dateOfBirth).toISOString(),
      classId: value.classId || null,
      outReachId: value.outReachId || null
    };

    this.studentApi.create(payload).subscribe({
      next: (created) => {
        this.studentForm.reset({
          khFirstName: '',
          khLastName: '',
          engFirstName: '',
          engLastName: '',
          gender: 'Male',
          dateOfBirth: '',
          classId: '',
          outReachId: ''
        });
        this.loadStudents();
        this.announce(`Created student ${created.engFirstName} ${created.engLastName}.`, 'success');
        this.busyStudent = false;
      },
      error: (error) => {
        this.announce(this.extractMessage(error, 'Failed to create student.'), 'error');
        this.busyStudent = false;
      }
    });
  }

  protected deleteStudent(id: string): void {
    this.studentApi.delete(id).subscribe({
      next: () => {
        this.loadStudents();
        this.announce('Student deleted.', 'success');
      },
      error: (error) => this.announce(this.extractMessage(error, 'Failed to delete student.'), 'error')
    });
  }

  protected createProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.busyProduct = true;
    const value = this.productForm.getRawValue();
    const payload: CreateProductRequest = {
      name: value.name.trim(),
      codeNumber: value.codeNumber.trim() || null,
      description: value.description.trim() || null,
      categoryId: value.categoryId || null,
      brandId: value.brandId || null,
      price: value.price.trim() ? Number(value.price) : null,
      quality: value.quality.trim() || null,
      voucherNumber: value.voucherNumber.trim() || null
    };

    this.productApi.create(payload).subscribe({
      next: (created) => {
        this.productForm.reset({
          name: '',
          codeNumber: '',
          description: '',
          categoryId: '',
          brandId: '',
          price: '',
          quality: '',
          voucherNumber: ''
        });
        this.loadProducts();
        this.announce(`Created product ${created.name}.`, 'success');
        this.busyProduct = false;
      },
      error: (error) => {
        this.announce(this.extractMessage(error, 'Failed to create product.'), 'error');
        this.busyProduct = false;
      }
    });
  }

  protected deleteProduct(id: string): void {
    if (!id) {
      this.announce('Product id is missing.', 'error');
      return;
    }

    this.productApi.delete(id).subscribe({
      next: () => {
        this.loadProducts();
        this.announce('Product deleted.', 'success');
      },
      error: (error) => this.announce(this.extractMessage(error, 'Failed to delete product.'), 'error')
    });
  }

  protected downloadMonthlyPdf(): void {
    const year = Number(this.reportForm.getRawValue().year);
    const month = Number(this.reportForm.getRawValue().month);

    this.reportApi.downloadMonthlyPdf(year, month).subscribe({
      next: (blob) => this.saveBlob(blob, `monthly-transactions-${year}-${month}.pdf`),
      error: (error) => this.announce(this.extractMessage(error, 'PDF generation failed.'), 'error')
    });
  }

  protected downloadMonthlyExcel(): void {
    const year = Number(this.reportForm.getRawValue().year);
    const month = Number(this.reportForm.getRawValue().month);

    this.reportApi.downloadMonthlyExcel(year, month).subscribe({
      next: (blob) => this.saveBlob(blob, `monthly-transactions-${year}-${month}.xlsx`),
      error: (error) => this.announce(this.extractMessage(error, 'Excel generation failed.'), 'error')
    });
  }

  protected queueMonthly(): void {
    const year = Number(this.reportForm.getRawValue().year);
    const month = Number(this.reportForm.getRawValue().month);

    this.reportApi.enqueueMonthly(year, month).subscribe({
      next: (result) => this.announce(result.message, 'success'),
      error: (error) => this.announce(this.extractMessage(error, 'Failed to queue report.'), 'error')
    });
  }

  private refreshAll(): void {
    this.loadLookups();
    this.loadClasses();
    this.loadStudents();
    this.loadProducts();
  }

  protected loadLookups(): void {
    forkJoin({
      classes: this.lookup.classes().pipe(catchError(() => of([]))),
      outreaches: this.lookup.outreaches().pipe(catchError(() => of([]))),
      brands: this.lookup.brands().pipe(catchError(() => of([]))),
      categories: this.lookup.categories().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        this.classOptions = result.classes;
        this.outreachOptions = result.outreaches;
        this.brandOptions = result.brands;
        this.categoryOptions = result.categories;
      }
    });
  }

  protected loadClasses(): void {
    this.classApi.list({ pageSize: 100 }).pipe(catchError(() => of({ items: [] as ClassDto[] }))).subscribe({
      next: (result) => {
        this.classes = result.items;
      }
    });
  }

  protected loadStudents(): void {
    this.studentApi.list({ pageSize: 100 }).pipe(catchError(() => of({ items: [] as StudentDto[] }))).subscribe({
      next: (result) => {
        this.students = result.items;
      }
    });
  }

  protected loadProducts(): void {
    this.productApi.list({ pageSize: 100 }).pipe(catchError(() => of({ items: [] as ProductDto[] }))).subscribe({
      next: (result) => {
        this.products = result.items;
      }
    });
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    this.announce(`Downloaded ${fileName}.`, 'success');
  }

  private announce(message: string, tone: ActivityEntry['tone']): void {
    this.statusMessage = message;
    this.statusTone = tone;
    this.activityLog = [
      {
        tone,
        message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...this.activityLog
    ].slice(0, 6);
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
