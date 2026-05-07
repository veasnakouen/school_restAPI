import { CommonModule } from '@angular/common';
import { ApplicationRef, ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, forkJoin, map, of, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ClassApiService } from '../../core/services/class-api.service';
import { CategoryApiService } from '../../core/services/category-api.service';
import { BrandApiService } from '../../core/services/brand-api.service';
import { LookupService } from '../../core/services/lookup.service';
import { ProductApiService } from '../../core/services/product-api.service';
import { ReportApiService } from '../../core/services/report-api.service';
import { StudentApiService } from '../../core/services/student-api.service';
import { ClassDto, CreateClassRequest, CreateStudentRequest, Gender, StudentDto } from '../../models/academic.model';
import { LookupOption } from '../../models/lookup.model';
import { BrandDto, CategoryDto, CreateProductRequest, ProductDto } from '../../models/inventory.model';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';

interface ActivityEntry {
  tone: 'success' | 'error' | 'info';
  message: string;
  time: string;
}

@Component({
  selector: 'app-api-console',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ScrollAnimateDirective, TableModule, DialogModule, ButtonModule, BadgeModule],
  template: `
    <div class="space-y-6">
      <!-- Top Navigation Tabs -->
      <div scrollAnimate animateVariant="fade-up" animateDelay="60ms" class="flex justify-start w-full mt-2">
        <div role="tablist" class="tabs tabs-boxed bg-base-100/60 border border-base-300/70 p-1.5 shadow-sm rounded-3xl inline-flex w-full sm:w-auto overflow-x-auto">
          <a role="tab" class="tab sm:min-w-32 rounded-2xl transition-all font-medium flex items-center justify-center gap-2" [class.tab-active]="activeTab === 'classes'" [class.bg-primary]="activeTab === 'classes'" [class.text-primary-content]="activeTab === 'classes'" (click)="activeTab = 'classes'">
    <div class="space-y-6 lg:space-y-8">
      
      <!-- Page Header -->
      <div scrollAnimate animateVariant="fade-up" class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-3">
            <i class="pi pi-bolt"></i> System Administration
          </div>
          <h1 class="text-3xl lg:text-4xl font-extrabold tracking-tight text-base-content">API Console</h1>
          <p class="text-base-content/60 text-sm mt-2 max-w-2xl">Centralized management and live data operations for your school's entities.</p>
        </div>
      </div>

      <!-- Modern Underline Tabs -->
      <div scrollAnimate animateVariant="fade-up" animateDelay="50ms" class="w-full border-b border-base-300/60">
        <div class="flex overflow-x-auto hide-scrollbar gap-8 pb-px">
          <button (click)="activeTab = 'classes'" [class.border-primary]="activeTab === 'classes'" [class.text-primary]="activeTab === 'classes'" [class.border-transparent]="activeTab !== 'classes'" [class.text-base-content/60]="activeTab !== 'classes'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-book"></i> Classes
          </a>
          <a role="tab" class="tab sm:min-w-32 rounded-2xl transition-all font-medium flex items-center justify-center gap-2" [class.tab-active]="activeTab === 'students'" [class.bg-primary]="activeTab === 'students'" [class.text-primary-content]="activeTab === 'students'" (click)="activeTab = 'students'">
          </button>
          <button (click)="activeTab = 'students'" [class.border-primary]="activeTab === 'students'" [class.text-primary]="activeTab === 'students'" [class.border-transparent]="activeTab !== 'students'" [class.text-base-content/60]="activeTab !== 'students'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-users"></i> Students
          </a>
          <a role="tab" class="tab sm:min-w-32 rounded-2xl transition-all font-medium flex items-center justify-center gap-2" [class.tab-active]="activeTab === 'products'" [class.bg-primary]="activeTab === 'products'" [class.text-primary-content]="activeTab === 'products'" (click)="activeTab = 'products'">
            <i class="pi pi-box"></i> Products
          </a>
          <a role="tab" class="tab sm:min-w-32 rounded-2xl transition-all font-medium flex items-center justify-center gap-2" [class.tab-active]="activeTab === 'reports'" [class.bg-primary]="activeTab === 'reports'" [class.text-primary-content]="activeTab === 'reports'" (click)="activeTab = 'reports'">
          </button>
          <button (click)="activeTab = 'products'" [class.border-primary]="activeTab === 'products'" [class.text-primary]="activeTab === 'products'" [class.border-transparent]="activeTab !== 'products'" [class.text-base-content/60]="activeTab !== 'products'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-box"></i> Inventory
          </button>
          <button (click)="activeTab = 'reports'" [class.border-primary]="activeTab === 'reports'" [class.text-primary]="activeTab === 'reports'" [class.border-transparent]="activeTab !== 'reports'" [class.text-base-content/60]="activeTab !== 'reports'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-chart-bar"></i> Reports
          </a>
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <section scrollAnimate animateVariant="fade-up" animateDelay="100ms">
            @if (activeTab === 'classes') {
              <article class="app-shell-panel space-y-5 p-5 lg:p-6 animate-in fade-in duration-300">
                <div class="flex items-center justify-between border-b border-base-300/50 pb-4">
                  <div>
                    <h2 class="section-title text-base-content m-0">Classes</h2>
                    <p class="text-sm text-base-content/65">Manage school classes.</p>
                  </div>
                  <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm rounded-full" (click)="loadClasses()">Refresh</button>
                    <button class="btn btn-primary btn-sm rounded-full" (click)="openClassModal()">Add Class</button>
                  </div>
                </div>
                
                <div class="overflow-x-auto rounded-xl border border-base-300/70 bg-base-100 shadow-sm">
                  <p-table [value]="classes" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Name</th>
                        <th>ID</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                      <tr>
                        <td class="font-medium">{{ item.className }}</td>
                        <td class="font-mono text-xs text-base-content/60">{{ item.id }}</td>
                        <td class="text-right whitespace-nowrap">
                          <button class="btn btn-ghost btn-xs text-info" (click)="editClass(item)">Edit</button>
                          <button class="btn btn-ghost btn-xs text-error" (click)="deleteClass(item.id, item.className)">Delete</button>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="3" class="py-8 text-center text-base-content/60">No classes loaded.</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </article>
            }
        @if (activeTab === 'classes') {
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-base-content">Classes Directory</h2>
                <p class="text-sm text-base-content/60">Create, edit, and manage school classes.</p>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-sm rounded-xl text-base-content/70 hover:bg-base-200" (click)="loadClasses()"><i class="pi pi-refresh"></i> Refresh</button>
                <button class="btn btn-primary btn-sm rounded-xl shadow-sm" (click)="openClassModal()"><i class="pi pi-plus"></i> Add Class</button>
              </div>
            </div>
            
            <div class="overflow-x-auto rounded-2xl border border-base-200">
              <p-table [value]="classes" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                  <tr>
                    <td class="font-medium text-base-content">{{ item.className }}</td>
                    <td class="font-mono text-xs text-base-content/60">{{ item.id }}</td>
                    <td class="text-right whitespace-nowrap">
                      <button class="btn btn-ghost btn-xs text-info hover:bg-info/10" (click)="editClass(item)">Edit</button>
                      <button class="btn btn-ghost btn-xs text-error hover:bg-error/10" (click)="deleteClass(item.id, item.className)">Delete</button>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="3" class="py-12 text-center text-base-content/50">No classes loaded. Add one to get started.</td></tr>
                </ng-template>
              </p-table>
            </div>
          </article>
        }

            @if (activeTab === 'students') {
              <article class="app-shell-panel space-y-5 p-5 lg:p-6 animate-in fade-in duration-300">
                <div class="flex items-center justify-between border-b border-base-300/50 pb-4">
                  <div>
                    <h2 class="section-title text-base-content m-0">Students</h2>
                    <p class="text-sm text-base-content/65">Manage students.</p>
                  </div>
                  <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm rounded-full" (click)="loadStudents()">Refresh</button>
                    <button class="btn btn-primary btn-sm rounded-full" (click)="openStudentModal()">Add Student</button>
                  </div>
                </div>
        @if (activeTab === 'students') {
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-base-content">Student Roster</h2>
                <p class="text-sm text-base-content/60">Manage student records and enrollments.</p>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-sm rounded-xl text-base-content/70 hover:bg-base-200" (click)="loadStudents()"><i class="pi pi-refresh"></i> Refresh</button>
                <button class="btn btn-primary btn-sm rounded-xl shadow-sm" (click)="openStudentModal()"><i class="pi pi-plus"></i> Add Student</button>
              </div>
            </div>

                <div class="overflow-x-auto rounded-xl border border-base-300/70 bg-base-100 shadow-sm">
                  <p-table [value]="students" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Name (EN)</th>
                        <th>Name (KH)</th>
                        <th>Gender</th>
                        <th>Class</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                      <tr>
                        <td>
                          <div class="font-medium">{{ item.engFirstName }} {{ item.engLastName }}</div>
                          <div class="text-xs text-base-content/60">{{ item.dateOfBirth | date:'shortDate' }}</div>
                        </td>
                        <td>{{ item.khFirstName }} {{ item.khLastName }}</td>
                        <td><p-badge [value]="item.gender" severity="info"></p-badge></td>
                        <td class="font-mono text-xs text-base-content/60">{{ item.classId || '-' }}</td>
                        <td class="text-right whitespace-nowrap">
                          <button class="btn btn-ghost btn-xs text-info" (click)="editStudent(item)">Edit</button>
                          <button class="btn btn-ghost btn-xs text-error" (click)="deleteStudent(item.id, item.engFirstName, item.engLastName)">Delete</button>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="5" class="py-8 text-center text-base-content/60">No students loaded.</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </article>
            }
            <div class="overflow-x-auto rounded-2xl border border-base-200">
              <p-table [value]="students" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Name (EN)</th>
                    <th>Name (KH)</th>
                    <th>Gender</th>
                    <th>Class</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                  <tr>
                    <td>
                      <div class="font-medium text-base-content">{{ item.engFirstName }} {{ item.engLastName }}</div>
                      <div class="text-xs text-base-content/50">{{ item.dateOfBirth | date:'mediumDate' }}</div>
                    </td>
                    <td class="text-base-content/80">{{ item.khFirstName }} {{ item.khLastName }}</td>
                    <td><span class="badge badge-ghost badge-sm text-xs">{{ item.gender }}</span></td>
                    <td class="font-mono text-xs text-base-content/60">{{ item.classId || '-' }}</td>
                    <td class="text-right whitespace-nowrap">
                      <button class="btn btn-ghost btn-xs text-info hover:bg-info/10" (click)="editStudent(item)">Edit</button>
                      <button class="btn btn-ghost btn-xs text-error hover:bg-error/10" (click)="deleteStudent(item.id, item.engFirstName, item.engLastName)">Delete</button>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="5" class="py-12 text-center text-base-content/50">No students loaded. Add one to get started.</td></tr>
                </ng-template>
              </p-table>
            </div>
          </article>
        }

            @if (activeTab === 'products') {
              <article class="app-shell-panel space-y-5 p-5 lg:p-6 animate-in fade-in duration-300">
                <div class="flex items-center justify-between border-b border-base-300/50 pb-4">
                  <div>
                    <h2 class="section-title text-base-content m-0">Inventory</h2>
                    <p class="text-sm text-base-content/65">Manage products.</p>
                  </div>
                  <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm rounded-full" (click)="loadProducts()">Refresh</button>
                    <button class="btn btn-primary btn-sm rounded-full" (click)="openProductModal()">Add Product</button>
                  </div>
                </div>
        @if (activeTab === 'products') {
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-base-content">Inventory Catalog</h2>
                <p class="text-sm text-base-content/60">Manage products, equipment, and assets.</p>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-sm rounded-xl text-base-content/70 hover:bg-base-200" (click)="loadProducts()"><i class="pi pi-refresh"></i> Refresh</button>
                <button class="btn btn-primary btn-sm rounded-xl shadow-sm" (click)="openProductModal()"><i class="pi pi-plus"></i> Add Product</button>
              </div>
            </div>

                <div class="overflow-x-auto rounded-xl border border-base-300/70 bg-base-100 shadow-sm">
                  <p-table [value]="products" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Category</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                      <tr>
                        <td>
                          <div class="font-medium">{{ item.name }}</div>
                          <div class="text-xs text-base-content/60">{{ item.codeNumber || '-' }}</div>
                        </td>
                        <td>{{ item.brandName || '-' }}</td>
                        <td>{{ item.categoryName || '-' }}</td>
                        <td class="text-right whitespace-nowrap">
                          <button class="btn btn-ghost btn-xs text-info" (click)="editProduct(item)">Edit</button>
                          <button class="btn btn-ghost btn-xs text-error" (click)="deleteProduct(item.id || '', item.name)">Delete</button>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="4" class="py-8 text-center text-base-content/60">No products loaded.</td></tr>
                    </ng-template>
                  </p-table>
                </div>
              </article>
            }
            <div class="overflow-x-auto rounded-2xl border border-base-200">
              <p-table [value]="products" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                  <tr>
                    <td>
                      <div class="font-medium text-base-content">{{ item.name }}</div>
                      <div class="text-xs text-base-content/50">{{ item.codeNumber || '-' }}</div>
                    </td>
                    <td class="text-base-content/80">{{ item.brandName || '-' }}</td>
                    <td class="text-base-content/80">{{ item.categoryName || '-' }}</td>
                    <td class="text-right whitespace-nowrap">
                      <button class="btn btn-ghost btn-xs text-info hover:bg-info/10" (click)="editProduct(item)">Edit</button>
                      <button class="btn btn-ghost btn-xs text-error hover:bg-error/10" (click)="deleteProduct(item.id || '', item.name)">Delete</button>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="4" class="py-12 text-center text-base-content/50">No products loaded. Add one to get started.</td></tr>
                </ng-template>
              </p-table>
            </div>
          </article>
        }

            @if (activeTab === 'reports') {
              <article class="app-shell-panel space-y-5 p-5 lg:p-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
                <div>
                  <h2 class="section-title mt-3 text-base-content">Monthly reports</h2>
                  <p class="mt-2 max-w-2xl text-sm text-base-content/65">Generate PDF, Excel, or queue the monthly transaction report.</p>
                </div>
        @if (activeTab === 'reports') {
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto">
            <div class="mb-8 text-center">
              <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <i class="pi pi-file-export text-3xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-base-content">Data Exporter</h2>
              <p class="text-base-content/60 mt-2 max-w-md mx-auto">Generate comprehensive monthly transaction reports in PDF or Excel formats.</p>
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
            <form class="bg-base-200/30 rounded-2xl border border-base-200 p-6 shadow-sm" [formGroup]="reportForm" (ngSubmit)="downloadMonthlyPdf()">
              <div class="grid gap-6 sm:grid-cols-2 mb-8">
                <label class="form-control w-full">
                  <div class="label pb-1.5"><span class="label-text text-sm font-semibold text-base-content/80">Report Year</span></div>
                  <input class="app-input py-2.5 rounded-xl bg-base-100" type="number" formControlName="year" placeholder="e.g. 2024" />
                </label>
                <label class="form-control w-full">
                  <div class="label pb-1.5"><span class="label-text text-sm font-semibold text-base-content/80">Report Month</span></div>
                  <input class="app-input py-2.5 rounded-xl bg-base-100" type="number" formControlName="month" placeholder="1-12" />
                </label>
              </div>

                  <div class="flex flex-wrap gap-3">
                    <button class="btn btn-primary rounded-full" type="button" (click)="downloadMonthlyPdf()">PDF</button>
                    <button class="btn btn-outline rounded-full" type="button" (click)="downloadMonthlyExcel()">Excel</button>
                    <button class="btn btn-secondary rounded-full" type="button" (click)="queueMonthly()">Queue job</button>
                  </div>
                </form>
              </article>
            }
          </section>
              <div class="flex flex-wrap items-center justify-center gap-4">
                <button class="btn btn-primary rounded-xl px-8 shadow-sm" type="button" (click)="downloadMonthlyPdf()"><i class="pi pi-file-pdf"></i> Download PDF</button>
                <button class="btn btn-outline rounded-xl px-8 bg-base-100 hover:bg-base-200" type="button" (click)="downloadMonthlyExcel()"><i class="pi pi-file-excel"></i> Download Excel</button>
              </div>
            </form>
          </article>
        }
      </section>

      <section scrollAnimate animateVariant="fade-up" animateDelay="160ms" class="app-shell-panel space-y-4 p-5 lg:p-6">
        <div class="flex items-center justify-between gap-4">
      <!-- Activity Log -->
      <section scrollAnimate animateVariant="fade-up" animateDelay="160ms" class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 mb-8">
        <div class="flex items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-accent badge-outline">Activity</span>
              <span class="badge badge-ghost">Live feedback</span>
            </div>
            <h2 class="section-title mt-3 text-base-content">Recent actions</h2>
            <h2 class="text-xl font-bold text-base-content flex items-center gap-2">
              <i class="pi pi-history text-primary"></i>
              Activity Log
            </h2>
            <p class="text-sm text-base-content/60 mt-1">Live monitoring of system operations.</p>
          </div>
          <div class="text-sm text-base-content/60">{{ statusMessage }}</div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-base-200 rounded-full">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            <span class="text-xs font-medium text-base-content/70">{{ statusMessage }}</span>
          </div>
        </div>

        <div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          @for (entry of activityLog; track entry.time + entry.message) {
            <div class="rounded-[22px] border border-base-300/70 bg-base-100/70 p-4 shadow-sm" [class.border-success/40]="entry.tone === 'success'" [class.border-error/40]="entry.tone === 'error'" [class.border-info/40]="entry.tone === 'info'">
              <div class="flex items-center justify-between gap-3">
                <span class="badge" [class.badge-success]="entry.tone === 'success'" [class.badge-error]="entry.tone === 'error'" [class.badge-info]="entry.tone === 'info'">{{ entry.tone }}</span>
                <span class="text-[11px] text-base-content/50">{{ entry.time }}</span>
            <div class="relative overflow-hidden rounded-2xl border border-base-200 bg-base-50 p-4 transition-all hover:shadow-md" 
                 [ngClass]="{
                   'border-l-4 border-l-success': entry.tone === 'success',
                   'border-l-4 border-l-error': entry.tone === 'error',
                   'border-l-4 border-l-info': entry.tone === 'info'
                 }">
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="flex items-center gap-2">
                  <i class="pi" 
                     [ngClass]="{
                       'pi-check-circle text-success': entry.tone === 'success',
                       'pi-times-circle text-error': entry.tone === 'error',
                       'pi-info-circle text-info': entry.tone === 'info'
                     }"></i>
                  <span class="font-semibold text-sm capitalize"
                        [ngClass]="{
                          'text-success': entry.tone === 'success',
                          'text-error': entry.tone === 'error',
                          'text-info': entry.tone === 'info'
                        }">{{ entry.tone }}</span>
                </div>
                <span class="text-[11px] font-medium text-base-content/40 bg-base-200 px-2 py-0.5 rounded-md">{{ entry.time }}</span>
              </div>
              <p class="mt-3 text-sm text-base-content/75">{{ entry.message }}</p>
              <p class="text-sm text-base-content/70 leading-relaxed">{{ entry.message }}</p>
            </div>
          } @empty {
            <div class="rounded-[22px] border border-dashed border-base-300/70 bg-base-100/60 p-6 text-sm text-base-content/60">No actions yet. Create a class, student, or product to see live API feedback here.</div>
            <div class="col-span-full rounded-2xl border border-dashed border-base-300 bg-base-50/50 py-12 flex flex-col items-center justify-center text-center">
              <i class="pi pi-inbox text-4xl text-base-content/20 mb-3"></i>
              <h3 class="text-base font-semibold text-base-content/60">No recent activity</h3>
              <p class="text-sm text-base-content/40 max-w-sm mt-1">Actions performed during this session will appear here in real-time.</p>
            </div>
          }
        </div>
      </section>
    </div>

    <!-- Form Modals -->
    <p-dialog [(visible)]="isClassModalVisible" [header]="editingClassId ? 'Edit Class' : 'Create Class'" [modal]="true" [dismissableMask]="true" [style]="{width: '450px'}">
      <form [formGroup]="classForm" (ngSubmit)="saveClass()" class="space-y-4 pt-2">
        <label class="form-control w-full">
          <div class="label pb-1"><span class="label-text text-sm font-semibold">Class name <span class="text-error">*</span></span></div>
          <input class="app-input py-2" formControlName="className" placeholder="Class 7A" />
        </label>
        <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-base-200">
          <button class="btn btn-ghost" type="button" (click)="cancelEditClass()">Cancel</button>
          <button class="btn btn-primary px-6" type="submit" [disabled]="classForm.invalid || busyClass">
            @if (busyClass) { <span class="loading loading-spinner loading-sm"></span> }
            {{ editingClassId ? 'Update' : 'Save' }}
          </button>
        </div>
      </form>
    </p-dialog>

    <p-dialog [(visible)]="isStudentModalVisible" [header]="editingStudentId ? 'Edit Student' : 'Create Student'" [modal]="true" [dismissableMask]="true" [style]="{width: '600px'}">
      <form [formGroup]="studentForm" (ngSubmit)="saveStudent()" class="space-y-4 pt-2">
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">First Name (KH) <span class="text-error">*</span></span></div>
            <input class="app-input py-1.5 px-3 text-sm" formControlName="khFirstName" />
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Last Name (KH) <span class="text-error">*</span></span></div>
            <input class="app-input py-1.5 px-3 text-sm" formControlName="khLastName" />
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">First Name (EN) <span class="text-error">*</span></span></div>
            <input class="app-input py-1.5 px-3 text-sm" formControlName="engFirstName" />
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Last Name (EN) <span class="text-error">*</span></span></div>
            <input class="app-input py-1.5 px-3 text-sm" formControlName="engLastName" />
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Gender <span class="text-error">*</span></span></div>
            <select class="select select-bordered select-sm rounded-xl" formControlName="gender">
              @for (g of genderOptions; track g) { <option [value]="g">{{ g }}</option> }
            </select>
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Date of birth <span class="text-error">*</span></span></div>
            <input class="app-input py-1.5 px-3 text-sm" type="date" formControlName="dateOfBirth" />
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Class</span></div>
            <select class="select select-bordered select-sm rounded-xl" formControlName="classId">
              <option value="">Select class</option>
              @for (c of classOptions; track c.value) { <option [value]="c.value">{{ c.label }}</option> }
            </select>
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Outreach</span></div>
            <select class="select select-bordered select-sm rounded-xl" formControlName="outReachId">
              <option value="">Select outreach</option>
              @for (o of outreachOptions; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
            </select>
          </label>
        </div>
        <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-base-200">
          <button class="btn btn-ghost" type="button" (click)="cancelEditStudent()">Cancel</button>
          <button class="btn btn-primary px-6" type="submit" [disabled]="studentForm.invalid || busyStudent">
            @if (busyStudent) { <span class="loading loading-spinner loading-sm"></span> }
            {{ editingStudentId ? 'Update' : 'Save' }}
          </button>
        </div>
      </form>
    </p-dialog>

    <p-dialog [header]="editingProductId ? 'Edit Product' : 'Create Product'" [(visible)]="isProductModalVisible" [modal]="true" [dismissableMask]="true" [style]="{width: '600px'}">
      <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="space-y-4 pt-2">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Name <span class="text-error">*</span></span></div>
            <input class="app-input py-1.5 px-3 text-sm" formControlName="name" placeholder="Projector" />
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Code number</span></div>
            <input class="app-input py-1.5 px-3 text-sm" formControlName="codeNumber" placeholder="PRD-001" />
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Category</span></div>
            <select class="select select-bordered select-sm rounded-xl" formControlName="categoryId">
              <option value="">Select Category</option>
              @for (c of categoryOptions; track c.value) { <option [value]="c.value">{{ c.label }}</option> }
            </select>
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Brand</span></div>
            <select class="select select-bordered select-sm rounded-xl" formControlName="brandId">
              <option value="">Select Brand</option>
              @for (b of brandOptions; track b.value) { <option [value]="b.value">{{ b.label }}</option> }
            </select>
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Price</span></div>
            <input class="app-input py-1.5 px-3 text-sm" type="number" formControlName="price" placeholder="1200" />
          </label>
          <label class="form-control w-full">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Quality</span></div>
            <input class="app-input py-1.5 px-3 text-sm" formControlName="quality" placeholder="New / Used" />
          </label>
          <label class="form-control w-full sm:col-span-2">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Voucher number</span></div>
            <input class="app-input py-1.5 px-3 text-sm" formControlName="voucherNumber" placeholder="VCH-1001" />
          </label>
          <label class="form-control w-full sm:col-span-2">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Description</span></div>
            <textarea class="textarea textarea-bordered min-h-16 rounded-xl text-sm" formControlName="description"></textarea>
          </label>
          <label class="form-control w-full sm:col-span-2">
            <div class="label pb-1"><span class="label-text text-xs font-semibold">Product Image</span></div>
            <input type="file" class="file-input file-input-bordered file-input-sm w-full" (change)="onFileSelected($event)" accept="image/*" />
            @if (selectedImage) { <div class="label"><span class="label-text-alt text-success">Selected: {{ selectedImage.name }}</span></div> }
          </label>
        </div>
        <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-base-200">
          <button class="btn btn-ghost" type="button" (click)="cancelEditProduct()">Cancel</button>
          <button class="btn btn-primary px-6" type="submit" [disabled]="productForm.invalid || busyProduct">
            @if (busyProduct) { <span class="loading loading-spinner loading-sm"></span> }
            {{ editingProductId ? 'Update' : 'Save' }}
          </button>
        </div>
      </form>
    </p-dialog>

    <!-- Delete Confirmation Modal -->
    <dialog id="delete-modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box max-w-md py-6">
        <div class="flex flex-col items-center text-center">
          <!-- Warning Icon -->
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
            <span class="pi pi-exclamation-triangle text-2xl text-error"></span>
          </div>

          <!-- Title -->
          <h3 class="mb-2 text-xl font-bold text-base-content">Confirm Deletion</h3>

          <!-- Message -->
          <p class="mb-5 text-base text-base-content/70">
            Are you sure you want to delete <strong class="text-base-content">{{ deleteItemName }}</strong>?
          </p>

          <!-- Action Buttons -->
          <div class="flex w-full gap-3">
            <button class="btn btn-ghost flex-1" type="button" (click)="closeDeleteModal()">
              Cancel
            </button>
            <button 
              class="btn btn-error flex-1" 
              type="button" 
              [class.loading]="deletingInProgress"
              (click)="confirmDelete()">
              @if (deletingInProgress) {
                <span class="loading loading-spinner loading-sm"></span>
                Deleting...
              } @else {
                Yes, Delete
              }
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" (click)="closeDeleteModal()">close</button>
      </form>
    </dialog>
  `
})
export class ApiConsoleComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly appRef = inject(ApplicationRef);
  private readonly ngZone = inject(NgZone);
  private readonly lookup = inject(LookupService);
  private readonly classApi = inject(ClassApiService);
  private readonly studentApi = inject(StudentApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly brandApi = inject(BrandApiService);
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

  protected selectedImage: File | null = null;

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedImage = file;
    }
  }

  protected readonly reportForm = this.fb.nonNullable.group({
    year: [new Date().getFullYear().toString(), [Validators.required]],
    month: [(new Date().getMonth() + 1).toString(), [Validators.required]]
  });

  protected activeTab: 'classes' | 'students' | 'products' | 'reports' = 'classes';
  
  protected isClassModalVisible = false;
  protected isStudentModalVisible = false;
  protected isProductModalVisible = false;
  protected editingClassId: string | null = null;
  protected editingStudentId: string | null = null;
  protected editingProductId: string | null = null;

  protected classes: ClassDto[] = [];
  protected students: StudentDto[] = [];
  protected products: ProductDto[] = [];
  protected classOptions: LookupOption[] = [];
  protected outreachOptions: LookupOption[] = [];
  protected categoryOptions: LookupOption[] = [];
  protected brandOptions: LookupOption[] = [];
  protected activityLog: ActivityEntry[] = [];
  protected statusMessage = 'Ready';
  protected busyClass = false;
  protected busyStudent = false;
  protected busyProduct = false;
  protected reloadTrigger = 0; // Increment to force reload

  // Delete confirmation modal properties
  protected deleteItemName = '';
  protected deleteItemType = 'item';
  protected deleteItemId: string | null = null;
  protected deleteItemTypeEnum: 'class' | 'student' | 'product' | null = null;
  protected deletingInProgress = false;
  protected statusTone: 'success' | 'error' | 'info' = 'info';

  ngOnInit(): void {
    this.refreshAll();
  }

  protected openClassModal() {
    this.editingClassId = null;
    this.classForm.reset();
    this.isClassModalVisible = true;
  }
  
  protected openStudentModal() {
    this.editingStudentId = null;
    this.studentForm.reset({ gender: 'Male' });
    this.isStudentModalVisible = true;
  }

  protected openProductModal() {
    this.editingProductId = null;
    this.productForm.reset();
    this.selectedImage = null;
    this.isProductModalVisible = true;
  }

  protected saveClass(): void {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    this.busyClass = true;
    const payload: any = { className: this.classForm.getRawValue().className.trim() };
    
    const obs$ = (this.editingClassId 
      ? this.classApi.update(this.editingClassId, payload)
      : this.classApi.create(payload)) as Observable<any>;

    obs$.pipe(
      finalize(() => {
        this.busyClass = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.cancelEditClass();
        this.loadClasses();
        this.loadLookups();
        this.announce(`Successfully saved class.`, 'success');
      },
      error: (error: any) => {
        this.announce(this.extractMessage(error, 'Failed to save class.'), 'error');
      }
    });
  }

  protected editClass(item: ClassDto): void {
    this.editingClassId = item.id;
    this.classForm.patchValue({ className: item.className });
    this.isClassModalVisible = true;
  }

  protected cancelEditClass(): void {
    this.editingClassId = null;
    this.classForm.reset({ className: '' });
    this.isClassModalVisible = false;
  }

  protected deleteClass(id: string, className: string): void {
    this.deleteItemId = id;
    this.deleteItemName = className;
    this.deleteItemType = 'class';
    this.deleteItemTypeEnum = 'class';
    this.openDeleteModal();
  }

  protected saveStudent(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.busyStudent = true;
    const value = this.studentForm.getRawValue();
    const payload: any = {
      khFirstName: value.khFirstName.trim() || null,
      khLastName: value.khLastName.trim() || null,
      engFirstName: value.engFirstName.trim(),
      engLastName: value.engLastName.trim(),
      gender: value.gender,
      dateOfBirth: value.dateOfBirth ? new Date(value.dateOfBirth).toISOString() : null,
      classId: value.classId || null,
      outReachId: value.outReachId || null
    };

    const obs$ = (this.editingStudentId 
      ? this.studentApi.update(this.editingStudentId, payload)
      : this.studentApi.create(payload)) as Observable<any>;

    obs$.pipe(
      finalize(() => {
        this.busyStudent = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.cancelEditStudent();
        this.loadStudents();
        this.announce(`Successfully saved student.`, 'success');
      },
      error: (error: any) => {
        this.announce(this.extractMessage(error, 'Failed to save student.'), 'error');
      }
    });
  }

  protected editStudent(item: StudentDto): void {
    this.editingStudentId = item.id!;
    this.studentForm.patchValue({
      khFirstName: item.khFirstName || '',
      khLastName: item.khLastName || '',
      engFirstName: item.engFirstName || '',
      engLastName: item.engLastName || '',
      gender: item.gender as Gender,
      dateOfBirth: item.dateOfBirth ? item.dateOfBirth.substring(0, 10) : '',
      classId: item.classId || '',
      outReachId: item.outReachId || ''
    });
  }

  protected cancelEditStudent(): void {
    this.editingStudentId = null;
    this.studentForm.reset({ khFirstName: '', khLastName: '', engFirstName: '', engLastName: '', gender: 'Male', dateOfBirth: '', classId: '', outReachId: '' });
    this.isStudentModalVisible = false;
  }

  protected deleteStudent(id: string, firstName: string, lastName: string): void {
    this.deleteItemId = id;
    this.deleteItemName = `${firstName} ${lastName}`;
    this.deleteItemType = 'student';
    this.deleteItemTypeEnum = 'student';
    this.openDeleteModal();
  }

  protected saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.busyProduct = true;
    const value = this.productForm.getRawValue();

    // Parse price
    const priceValue = value.price;
    const parsedPrice = typeof priceValue === 'string' && priceValue.trim() ? Number(priceValue) : typeof priceValue === 'number' && !isNaN(priceValue) ? priceValue : null;

    const payload: any = {
      name: value.name?.trim() || '',
      codeNumber: value.codeNumber?.trim() || null,
      description: value.description?.trim() || null,
      categoryId: value.categoryId || null,
      brandId: value.brandId || null,
      price: parsedPrice,
      quality: value.quality?.trim() || null,
      voucherNumber: value.voucherNumber?.trim() || null
    };

    const obs$ = (this.editingProductId
      ? this.productApi.update(this.editingProductId, payload)
      : this.productApi.create(payload)) as Observable<any>;

    obs$.pipe(
      finalize(() => {
        this.busyProduct = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (saved: any) => {
        if (this.selectedImage && saved.id) {
          this.productApi.uploadImage(saved.id, this.selectedImage).subscribe();
        }
        this.cancelEditProduct();
        this.loadProducts();
        this.announce(`Successfully saved product.`, 'success');
      },
      error: (error: any) => {
        const errorMsg = error?.error?.message ?? error?.message ?? 'Failed to create product.';
        this.announce(this.extractMessage(error, errorMsg), 'error');
      }
    });
  }

  protected editProduct(item: ProductDto): void {
    this.editingProductId = item.id!;
    this.productForm.patchValue({
      name: item.name || '',
      codeNumber: item.codeNumber || '',
      description: item.description || '',
      categoryId: item.categoryId || '',
      brandId: item.brandId || '',
      price: item.price?.toString() || '',
      quality: item.quality || '',
      voucherNumber: item.voucherNumber || ''
    });
  }

  protected cancelEditProduct(): void {
    this.editingProductId = null;
    this.productForm.reset({ name: '', codeNumber: '', description: '', categoryId: '', brandId: '', price: '', quality: '', voucherNumber: '' });
    this.selectedImage = null;
    const fileInput = document.querySelector('.file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.isProductModalVisible = false;
  }

  protected deleteProduct(id: string, productName: string): void {
    if (!id) {
      this.announce('Product id is missing.', 'error');
      return;
    }
    this.deleteItemId = id;
    this.deleteItemName = productName;
    this.deleteItemType = 'product';
    this.deleteItemTypeEnum = 'product';
    this.openDeleteModal();
  }

  protected downloadMonthlyPdf(): void {
    const year = Number(this.reportForm.getRawValue().year);
    const month = Number(this.reportForm.getRawValue().month);

    this.reportApi.downloadMonthlyPdf(year, month).subscribe({
      next: (blob) => this.saveBlob(blob, `monthly-transactions-${year}-${month}.pdf`),
      error: (error: any) => this.announce(this.extractMessage(error, 'PDF generation failed.'), 'error')
    });
  }

  protected downloadMonthlyExcel(): void {
    const year = Number(this.reportForm.getRawValue().year);
    const month = Number(this.reportForm.getRawValue().month);

    this.reportApi.downloadMonthlyExcel(year, month).subscribe({
      next: (blob) => this.saveBlob(blob, `monthly-transactions-${year}-${month}.xlsx`),
      error: (error: any) => this.announce(this.extractMessage(error, 'Excel generation failed.'), 'error')
    });
  }

  protected queueMonthly(): void {
    const year = Number(this.reportForm.getRawValue().year);
    const month = Number(this.reportForm.getRawValue().month);

    this.reportApi.enqueueMonthly(year, month).subscribe({
      next: (result) => this.announce(result.message, 'success'),
      error: (error: any) => this.announce(this.extractMessage(error, 'Failed to queue report.'), 'error')
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
    this.classApi.list({ pageSize: 100 }).pipe(
      catchError(() => of({ items: [] as ClassDto[] })),
      finalize(() => {
        this.cdr.detectChanges();
        this.appRef.tick();
      })
    ).subscribe({
      next: (result) => {
        this.classes = result.items;
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    });
  }

  protected loadStudents(): void {
    this.studentApi.list({ pageSize: 100 }).pipe(
      catchError(() => of({ items: [] as StudentDto[] })),
      finalize(() => {
        this.cdr.detectChanges();
        this.appRef.tick();
      })
    ).subscribe({
      next: (result) => {
        this.students = result.items;
        this.cdr.detectChanges();
        this.appRef.tick();
      }
    });
  }

  protected loadProducts(): void {
    forkJoin({
      products: this.productApi.list({ pageSize: 100 }).pipe(catchError(() => of({ items: [] as ProductDto[] }))),
      categories: this.categoryApi.list().pipe(catchError(() => of([] as CategoryDto[]))),
      brands: this.brandApi.list().pipe(catchError(() => of([] as BrandDto[])))
    }).pipe(
      finalize(() => {
        this.cdr.detectChanges();
        this.appRef.tick();
      })
    ).subscribe({
      next: (result) => {
        this.products = result.products.items;
        this.categoryOptions = result.categories
          .filter(c => !!c.id)
          .map(c => ({ value: c.id!, label: c.name }));
        this.brandOptions = result.brands
          .filter(b => !!b.id)
          .map(b => ({ value: b.id!, label: b.name }));
        this.cdr.detectChanges();
        this.appRef.tick();
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

  // Delete confirmation modal methods
  protected openDeleteModal(): void {
    const modal = document.getElementById('delete-modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
      this.cdr.detectChanges();
    }
  }

  protected closeDeleteModal(): void {
    const modal = document.getElementById('delete-modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
      this.deleteItemId = null;
      this.deleteItemName = '';
      this.deleteItemType = 'item';
      this.deleteItemTypeEnum = null;
      this.deletingInProgress = false;
      this.cdr.detectChanges();
    }
  }

  protected confirmDelete(): void {
    if (!this.deleteItemId || !this.deleteItemTypeEnum) {
      this.announce('No item selected for deletion.', 'error');
      return;
    }

    this.deletingInProgress = true;
    this.cdr.detectChanges();

    // Perform the actual deletion based on item type
    switch (this.deleteItemTypeEnum) {
      case 'class':
        this.performDeleteClass(this.deleteItemId);
        break;
      case 'student':
        this.performDeleteStudent(this.deleteItemId);
        break;
      case 'product':
        this.performDeleteProduct(this.deleteItemId);
        break;
    }
  }

  private performDeleteClass(id: string): void {
    this.classApi.delete(id).subscribe({
      next: () => {
        this.announce('Class deleted.', 'success');
        this.closeDeleteModal();
        // Small delay to ensure backend cache invalidation completes
        setTimeout(() => {
          this.loadClasses();
          this.loadLookups();
        }, 200);
      },
      error: (error: any) => {
        this.announce(this.extractMessage(error, 'Failed to delete class.'), 'error');
        this.closeDeleteModal();
      }
    });
  }

  private performDeleteStudent(id: string): void {
    this.studentApi.delete(id).subscribe({
      next: () => {
        this.announce('Student deleted.', 'success');
        this.closeDeleteModal();
        setTimeout(() => this.loadStudents(), 200);
      },
      error: (error: any) => {
        this.announce(this.extractMessage(error, 'Failed to delete student.'), 'error');
        this.closeDeleteModal();
      }
    });
  }

  private performDeleteProduct(id: string): void {
    this.productApi.delete(id).subscribe({
      next: () => {
        this.announce('Product deleted.', 'success');
        this.closeDeleteModal();
        setTimeout(() => this.loadProducts(), 200);
      },
      error: (error: any) => {
        this.announce(this.extractMessage(error, 'Failed to delete product.'), 'error');
        this.closeDeleteModal();
      }
    });
  }
}
