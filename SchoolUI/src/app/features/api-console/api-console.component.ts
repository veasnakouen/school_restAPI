import { CommonModule } from '@angular/common';
import { ApplicationRef, ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';

export interface OutReachDto {
  id?: string;
  firstName?: string;
  lastName?: string;
  nickName?: string;
  contact?: string;
  imageUrl?: string | null;
}

export interface InterventionDto {
  id?: string;
  studentId: string;
  studentName?: string;
  status: string;
  notes: string;
  dateReported?: string;
}

interface ActivityEntry {
  tone: 'success' | 'error' | 'info';
  message: string;
  time: string;
}

@Component({
  selector: 'app-api-console',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ScrollAnimateDirective, TableModule, DialogModule, ButtonModule, BadgeModule, InputTextModule, DatePickerModule, TooltipModule],
  template: `
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
          </button>
          <button (click)="activeTab = 'students'" [class.border-primary]="activeTab === 'students'" [class.text-primary]="activeTab === 'students'" [class.border-transparent]="activeTab !== 'students'" [class.text-base-content/60]="activeTab !== 'students'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-users"></i> Students
          </button>
          <button (click)="activeTab = 'outreaches'" [class.border-primary]="activeTab === 'outreaches'" [class.text-primary]="activeTab === 'outreaches'" [class.border-transparent]="activeTab !== 'outreaches'" [class.text-base-content/60]="activeTab !== 'outreaches'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-id-card"></i> Outreach
          </button>
          <button (click)="activeTab = 'interventions'" [class.border-primary]="activeTab === 'interventions'" [class.text-primary]="activeTab === 'interventions'" [class.border-transparent]="activeTab !== 'interventions'" [class.text-base-content/60]="activeTab !== 'interventions'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-heart"></i> Interventions
          </button>
          <button (click)="activeTab = 'products'" [class.border-primary]="activeTab === 'products'" [class.text-primary]="activeTab === 'products'" [class.border-transparent]="activeTab !== 'products'" [class.text-base-content/60]="activeTab !== 'products'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-box"></i> Inventory
          </button>
          <button (click)="activeTab = 'reports'" [class.border-primary]="activeTab === 'reports'" [class.text-primary]="activeTab === 'reports'" [class.border-transparent]="activeTab !== 'reports'" [class.text-base-content/60]="activeTab !== 'reports'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-chart-bar"></i> Reports
          </button>
          <button (click)="activeTab = 'activity'" [class.border-primary]="activeTab === 'activity'" [class.text-primary]="activeTab === 'activity'" [class.border-transparent]="activeTab !== 'activity'" [class.text-base-content/60]="activeTab !== 'activity'" class="flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all hover:text-primary whitespace-nowrap">
            <i class="pi pi-history"></i> Activity
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <section scrollAnimate animateVariant="fade-up" animateDelay="100ms">
        @if (activeTab === 'classes') {
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-base-content">Classes Directory</h2>
                <p class="text-sm text-base-content/60">Create, edit, and manage school classes.</p>
              </div>
              <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div class="relative w-full sm:w-auto">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>
                  <input #searchClasses pInputText type="text" (input)="dtClasses.filterGlobal(searchClasses.value, 'contains')" placeholder="Search classes..." class="pl-9 w-full sm:w-64 p-inputtext-sm rounded-xl border border-base-300" />
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button class="btn btn-ghost btn-sm rounded-xl text-base-content/70 hover:bg-base-200" (click)="loadClasses()"><i class="pi pi-refresh"></i> Refresh</button>
                  <button class="btn btn-primary btn-sm rounded-xl shadow-sm" (click)="openClassModal()"><i class="pi pi-plus"></i> Add Class</button>
                </div>
              </div>
            </div>
            
            <div class="overflow-x-auto rounded-2xl border border-base-200">
              <p-table #dtClasses [value]="classes" [globalFilterFields]="['className', 'id']" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
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
                      <div class="flex justify-end gap-1">
                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" pTooltip="Edit" tooltipPosition="top" (onClick)="editClass(item)"></p-button>
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Delete" tooltipPosition="top" (onClick)="deleteClass(item.id, item.className)"></p-button>
                      </div>
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
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-base-content">Student Roster</h2>
                <p class="text-sm text-base-content/60">Manage student records and enrollments.</p>
              </div>
              <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div class="relative w-full sm:w-auto">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>
                  <input #searchStudents pInputText type="text" (input)="dtStudents.filterGlobal(searchStudents.value, 'contains')" placeholder="Search students..." class="pl-9 w-full sm:w-64 p-inputtext-sm rounded-xl border border-base-300" />
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button class="btn btn-ghost btn-sm rounded-xl text-base-content/70 hover:bg-base-200" (click)="loadStudents()"><i class="pi pi-refresh"></i> Refresh</button>
                  <button class="btn btn-primary btn-sm rounded-xl shadow-sm" (click)="openStudentModal()"><i class="pi pi-plus"></i> Add Student</button>
                </div>
              </div>
            </div>

            <div class="overflow-x-auto rounded-2xl border border-base-200">
              <p-table #dtStudents [value]="students" [globalFilterFields]="['engFirstName', 'engLastName', 'khFirstName', 'khLastName', 'gender']" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Name (EN)</th>
                    <th>Name (KH)</th>
                    <th>Gender</th>
                    <th>Class</th>
                    <th>Outreach</th>
                    <th>Status</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                  <tr>
                    <td>
                      <div class="font-medium text-base-content">{{ item.engFirstName }} {{ item.engLastName }}</div>
                      <div class="text-xs text-base-content/50"><i class="pi pi-calendar text-[10px] mr-1"></i>{{ item.dateOfBirth | date:'mediumDate' }}</div>
                    </td>
                    <td class="text-base-content/80">{{ item.khFirstName }} {{ item.khLastName }}</td>
                    <td><p-badge [value]="item.gender" [severity]="item.gender === 'Male' ? 'info' : (item.gender === 'Female' ? 'warn' : 'secondary')"></p-badge></td>
                    <td>
                      @if (getClassName(item.classId)) {
                        <span class="badge badge-outline border-primary/40 bg-primary/5 text-primary text-xs font-semibold">{{ getClassName(item.classId) }}</span>
                      } @else {
                        <span class="text-base-content/30">-</span>
                      }
                    </td>
                    <td>
                      @if (getOutreachName(item.outReachId)) {
                        <span class="badge badge-outline border-secondary/40 bg-secondary/5 text-secondary text-xs font-semibold">{{ getOutreachName(item.outReachId) }}</span>
                      } @else {
                        <span class="text-base-content/30">-</span>
                      }
                    </td>
                    <td>
                      <p-badge [value]="item.isActive !== false ? 'Active' : 'Inactive'" [severity]="item.isActive !== false ? 'success' : 'secondary'"></p-badge>
                    </td>
                    <td class="text-right whitespace-nowrap">
                      <div class="flex justify-end gap-1">
                        <p-button [icon]="item.isActive !== false ? 'pi pi-ban' : 'pi pi-check-circle'" [rounded]="true" [text]="true"ot ="item.isActive !== false ? 'warning' : 'success'" [pTooltip]="item.isActive !== false ? 'Deactivate' : 'Activate'" tooltipPosition="top" (onClick)="toggleStudentStatus(item)"></p-button>
                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" pTooltip="Edit" tooltipPosition="top" (onClick)="editStudent(item)"></p-button>
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Delete" tooltipPosition="top" (onClick)="deleteStudent(item.id, item.engFirstName, item.engLastName)"></p-button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="7" class="py-12 text-center text-base-content/50">No students loaded. Add one to get started.</td></tr>
                </ng-template>
              </p-table>
            </div>
          </article>
        }

        @if (activeTab === 'outreaches') {
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-base-content">Outreach Workers</h2>
                <p class="text-sm text-base-content/60">Manage community outreach workers and social workers.</p>
              </div>
              <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div class="relative w-full sm:w-auto">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>
                  <input #searchOutreaches pInputText type="text" (input)="dtOutreaches.filterGlobal(searchOutreaches.value, 'contains')" placeholder="Search workers..." class="pl-9 w-full sm:w-64 p-inputtext-sm rounded-xl border border-base-300" />
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button class="btn btn-ghost btn-sm rounded-xl text-base-content/70 hover:bg-base-200" (click)="loadOutreaches()"><i class="pi pi-refresh"></i> Refresh</button>
                  <button class="btn btn-primary btn-sm rounded-xl shadow-sm" (click)="openOutreachModal()"><i class="pi pi-plus"></i> Add Worker</button>
                </div>
              </div>
            </div>

            <div class="overflow-x-auto rounded-2xl border border-base-200">
              <p-table #dtOutreaches [value]="outreaches" [globalFilterFields]="['firstName', 'lastName', 'nickName', 'contact']" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Name</th>
                    <th>Nickname</th>
                    <th>Contact Info</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                  <tr>
                    <td class="font-medium text-base-content">
                      <div class="flex items-center gap-3">
                        <div class="avatar placeholder">
                          <div class="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                            @if (item.imageUrl) {
                              <img [src]="item.imageUrl" alt="Avatar" class="object-cover w-full h-full" />
                            } @else {
                              <span class="font-bold text-sm">{{ item.firstName?.charAt(0) || '' }}{{ item.lastName?.charAt(0) || '' }}</span>
                            }
                          </div>
                        </div>
                        <div>
                          <div class="font-medium text-base-content">{{ item.firstName }} {{ item.lastName }}</div>
                        </div>
                      </div>
                    </td>
                    <td>{{ item.nickName || '-' }}</td>
                    <td>{{ item.contact || '-' }}</td>
                    <td class="text-right whitespace-nowrap">
                      <div class="flex justify-end gap-1">
                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" pTooltip="Edit" tooltipPosition="top" (onClick)="editOutreach(item)"></p-button>
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Delete" tooltipPosition="top" (onClick)="deleteOutreach(item.id, item.firstName + ' ' + item.lastName)"></p-button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="4" class="py-12 text-center text-base-content/50">No outreach workers found.</td></tr>
                </ng-template>
              </p-table>
            </div>
          </article>
        }

        @if (activeTab === 'interventions') {
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-base-content">Truancy & Welfare</h2>
                <p class="text-sm text-base-content/60">Manage student flags, case notes, and outreach interventions.</p>
              </div>
              <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div class="relative w-full sm:w-auto">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>
                  <input #searchInterventions pInputText type="text" (input)="dtInterventions.filterGlobal(searchInterventions.value, 'contains')" placeholder="Search cases..." class="pl-9 w-full sm:w-64 p-inputtext-sm rounded-xl border border-base-300" />
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button class="btn btn-ghost btn-sm rounded-xl text-base-content/70 hover:bg-base-200" (click)="loadInterventions()"><i class="pi pi-refresh"></i> Refresh</button>
                  <button class="btn btn-primary btn-sm rounded-xl shadow-sm" (click)="openInterventionModal()"><i class="pi pi-plus"></i> Log Intervention</button>
                </div>
              </div>
            </div>

            <div class="overflow-x-auto rounded-2xl border border-base-200">
              <p-table #dtInterventions [value]="interventions" [globalFilterFields]="['studentName', 'status', 'notes']" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Date Reported</th>
                    <th>Notes</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                  <tr>
                    <td class="font-medium text-base-content">{{ getStudentName(item.studentId) }}</td>
                    <td><p-badge [value]="item.status" [severity]="item.status === 'Resolved' ? 'success' : (item.status === 'Open' ? 'danger' : 'warn')"></p-badge></td>
                    <td class="text-xs text-base-content/60">{{ (item.dateReported | date:'mediumDate') || '-' }}</td>
                    <td class="max-w-[200px] truncate" [pTooltip]="item.notes" tooltipPosition="top">{{ item.notes || '-' }}</td>
                    <td class="text-right whitespace-nowrap">
                      <div class="flex justify-end gap-1">
                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" pTooltip="Edit" tooltipPosition="top" (onClick)="editIntervention(item)"></p-button>
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Delete" tooltipPosition="top" (onClick)="deleteIntervention(item.id)"></p-button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr><td colspan="5" class="py-12 text-center text-base-content/50">No interventions found.</td></tr>
                </ng-template>
              </p-table>
            </div>
          </article>
        }

        @if (activeTab === 'products') {
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-base-content">Inventory Catalog</h2>
                <p class="text-sm text-base-content/60">Manage products, equipment, and assets.</p>
              </div>
              <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div class="relative w-full sm:w-auto">
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>
                  <input #searchProducts pInputText type="text" (input)="dtProducts.filterGlobal(searchProducts.value, 'contains')" placeholder="Search products..." class="pl-9 w-full sm:w-64 p-inputtext-sm rounded-xl border border-base-300" />
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button class="btn btn-ghost btn-sm rounded-xl text-base-content/70 hover:bg-base-200" (click)="loadProducts()"><i class="pi pi-refresh"></i> Refresh</button>
                  <button class="btn btn-primary btn-sm rounded-xl shadow-sm" (click)="openProductModal()"><i class="pi pi-plus"></i> Add Product</button>
                </div>
              </div>
            </div>

            <div class="overflow-x-auto rounded-2xl border border-base-200">
              <p-table #dtProducts [value]="products" [globalFilterFields]="['name', 'codeNumber', 'brandName', 'categoryName']" [paginator]="true" [rows]="10" styleClass="p-datatable-sm p-datatable-striped [&_th]:!bg-base-200/50">
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
                      <div class="flex justify-end gap-1">
                        <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" pTooltip="Edit" tooltipPosition="top" (onClick)="editProduct(item)"></p-button>
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" pTooltip="Delete" tooltipPosition="top" (onClick)="deleteProduct(item.id || '', item.name)"></p-button>
                      </div>
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
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto">
            <div class="mb-8 text-center">
              <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <i class="pi pi-file-export text-3xl"></i>
              </div>
              <h2 class="text-2xl font-bold text-base-content">Data Exporter</h2>
              <p class="text-base-content/60 mt-2 max-w-md mx-auto">Generate comprehensive monthly transaction reports in PDF or Excel formats.</p>
            </div>

            <form class="bg-base-200/30 rounded-2xl border border-base-200 p-6 shadow-sm" [formGroup]="reportForm" (ngSubmit)="downloadMonthlyPdf()">
              <div class="grid gap-6 sm:grid-cols-1 mb-8 max-w-xs mx-auto">
                <label class="form-control w-full">
                  <div class="label pb-1.5"><span class="label-text text-sm font-semibold text-base-content/80">Report Month & Year</span></div>
                  <p-datepicker formControlName="monthYear" view="month" dateFormat="MM, yy" [readonlyInput]="true" styleClass="w-full" inputStyleClass="app-input py-2.5 rounded-xl bg-base-100 w-full text-center"></p-datepicker>
                </label>
              </div>

              <div class="flex flex-wrap items-center justify-center gap-4">
                <button class="btn btn-primary rounded-xl px-8 shadow-sm" type="button" (click)="downloadMonthlyPdf()"><i class="pi pi-file-pdf"></i> Download PDF</button>
                <button class="btn btn-outline rounded-xl px-8 bg-base-100 hover:bg-base-200" type="button" (click)="downloadMonthlyExcel()"><i class="pi pi-file-excel"></i> Download Excel</button>
                <button class="btn btn-secondary rounded-xl px-8 shadow-sm" type="button" (click)="queueMonthly()"><i class="pi pi-spin pi-cog"></i> Queue Job</button>
              </div>
            </form>
          </article>
        }

        @if (activeTab === 'activity') {
          <article class="bg-base-100 rounded-3xl border border-base-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 class="text-xl font-bold text-base-content flex items-center gap-2">
                  <i class="pi pi-history text-primary"></i>
                  Activity Log
                </h2>
                <p class="text-sm text-base-content/60 mt-1">Live monitoring of system operations.</p>
              </div>
              <div class="flex items-center gap-2 px-3 py-1.5 bg-base-200 rounded-full">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                </span>
                <span class="text-xs font-medium text-base-content/70">{{ statusMessage }}</span>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              @for (entry of activityLog; track entry.time + entry.message) {
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
                  <p class="text-sm text-base-content/70 leading-relaxed">{{ entry.message }}</p>
                </div>
              } @empty {
                <div class="col-span-full rounded-2xl border border-dashed border-base-300 bg-base-50/50 py-12 flex flex-col items-center justify-center text-center">
                  <i class="pi pi-inbox text-4xl text-base-content/20 mb-3"></i>
                  <h3 class="text-base font-semibold text-base-content/60">No recent activity</h3>
                  <p class="text-sm text-base-content/40 max-w-sm mt-1">Actions performed during this session will appear here in real-time.</p>
                </div>
              }
            </div>
          </article>
        }
      </section>
    </div>

    <!-- Form Modals -->
    <p-dialog [(visible)]="isClassModalVisible" [header]="editingClassId ? 'Edit Class' : 'Create Class'" [modal]="true" [dismissableMask]="true" [style]="{width: '450px'}">
      <form [formGroup]="classForm" (ngSubmit)="saveClass()" class="flex flex-col gap-5 pt-3">
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-sm font-semibold text-base-content/90">Class Name <span class="text-error">*</span></label>
          <div class="relative">
            <i class="pi pi-book absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>
            <input pInputText type="text" formControlName="className" placeholder="e.g. Class 7A" class="w-full pl-10" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-4 mt-2 border-t border-base-200">
          <button class="btn btn-ghost" type="button" (click)="cancelEditClass()">Cancel</button>
          <button class="btn btn-primary px-6" type="submit" [disabled]="classForm.invalid || busyClass">
            @if (busyClass) { <span class="loading loading-spinner loading-sm"></span> }
            {{ editingClassId ? 'Update' : 'Save' }}
          </button>
        </div>
      </form>
    </p-dialog>

    <p-dialog [(visible)]="isStudentModalVisible" [header]="editingStudentId ? 'Edit Student' : 'Create Student'" [modal]="true" [dismissableMask]="true" [style]="{width: '650px'}">
      <form [formGroup]="studentForm" (ngSubmit)="saveStudent()" class="flex flex-col gap-4 pt-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">First Name (EN) <span class="text-error">*</span></label>
            <input pInputText type="text" formControlName="engFirstName" placeholder="John" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Last Name (EN) <span class="text-error">*</span></label>
            <input pInputText type="text" formControlName="engLastName" placeholder="Doe" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">First Name (KH) <span class="text-error">*</span></label>
            <input pInputText type="text" formControlName="khFirstName" placeholder="សុខ" class="w-full font-khmer" />
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Last Name (KH) <span class="text-error">*</span></label>
            <input pInputText type="text" formControlName="khLastName" placeholder="សាន" class="w-full font-khmer" />
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Gender <span class="text-error">*</span></label>
          <div class="relative">
            <select pInputText formControlName="gender" class="w-full appearance-none pr-8 cursor-pointer">
              @for (g of genderOptions; track g) { <option [value]="g">{{ g }}</option> }
            </select>
            <i class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none text-sm"></i>
          </div>
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Date of Birth <span class="text-error">*</span></label>
            <p-datepicker formControlName="dateOfBirth" appendTo="body" [showIcon]="true" styleClass="w-full" inputStyleClass="p-inputtext w-full" dateFormat="yy-mm-dd" dataType="string" placeholder="Select a date"></p-datepicker>
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Class Enrollment</label>
          <div class="relative">
            <select pInputText formControlName="classId" class="w-full appearance-none pr-8 cursor-pointer">
              <option value="">Select a class...</option>
              @for (c of classOptions; track c.value) { <option [value]="c.value">{{ c.label }}</option> }
            </select>
            <i class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none text-sm"></i>
          </div>
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Outreach Worker</label>
          <div class="relative">
            <select pInputText formControlName="outReachId" class="w-full appearance-none pr-8 cursor-pointer">
              <option value="">Assign an outreach worker...</option>
              @for (o of outreachOptions; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
            </select>
            <i class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none text-sm"></i>
          </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-4 mt-2 border-t border-base-200">
          <button class="btn btn-ghost" type="button" (click)="cancelEditStudent()">Cancel</button>
          <button class="btn btn-primary px-6" type="submit" [disabled]="studentForm.invalid || busyStudent">
            @if (busyStudent) { <span class="loading loading-spinner loading-sm"></span> }
            {{ editingStudentId ? 'Update' : 'Save' }}
          </button>
        </div>
      </form>
    </p-dialog>

    <p-dialog [header]="editingProductId ? 'Edit Product' : 'Create Product'" [(visible)]="isProductModalVisible" [modal]="true" [dismissableMask]="true" [style]="{width: '650px'}">
      <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="flex flex-col gap-4 pt-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Product Name <span class="text-error">*</span></label>
            <input pInputText type="text" formControlName="name" placeholder="e.g. Dell XPS 15" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Code Number</label>
            <input pInputText type="text" formControlName="codeNumber" placeholder="e.g. PRD-001" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Category</label>
          <div class="relative">
            <select pInputText formControlName="categoryId" class="w-full appearance-none pr-8 cursor-pointer">
              <option value="">Select category...</option>
              @for (c of categoryOptions; track c.value) { <option [value]="c.value">{{ c.label }}</option> }
            </select>
            <i class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none text-sm"></i>
          </div>
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Brand</label>
          <div class="relative">
            <select pInputText formControlName="brandId" class="w-full appearance-none pr-8 cursor-pointer">
              <option value="">Select brand...</option>
              @for (b of brandOptions; track b.value) { <option [value]="b.value">{{ b.label }}</option> }
            </select>
            <i class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none text-sm"></i>
          </div>
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Price</label>
            <div class="relative">
              <i class="pi pi-dollar absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>
              <input pInputText type="number" formControlName="price" placeholder="0.00" class="w-full pl-9" />
            </div>
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Condition</label>
            <input pInputText type="text" formControlName="quality" placeholder="e.g. New, Used" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5 w-full sm:col-span-2">
            <label class="text-sm font-semibold text-base-content/90">Voucher Number</label>
            <input pInputText type="text" formControlName="voucherNumber" placeholder="e.g. VCH-1001" class="w-full" />
          </div>
          <div class="flex flex-col gap-1.5 w-full sm:col-span-2">
            <label class="text-sm font-semibold text-base-content/90">Description</label>
            <textarea class="textarea textarea-bordered w-full text-base min-h-[100px]" formControlName="description" placeholder="Additional details about the product..." rows="3"></textarea>
          </div>
          <div class="flex flex-col gap-1.5 w-full sm:col-span-2">
            <label class="text-sm font-semibold text-base-content/90">Product Image</label>
            <input type="file" class="file-input file-input-bordered file-input-sm w-full" (change)="onFileSelected($event)" accept="image/*" />
            @if (selectedImage) { <div class="text-xs text-success mt-1 font-medium"><i class="pi pi-check-circle mr-1"></i>Selected: {{ selectedImage.name }}</div> }
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-4 mt-2 border-t border-base-200">
          <button class="btn btn-ghost" type="button" (click)="cancelEditProduct()">Cancel</button>
          <button class="btn btn-primary px-6" type="submit" [disabled]="productForm.invalid || busyProduct">
            @if (busyProduct) { <span class="loading loading-spinner loading-sm"></span> }
            {{ editingProductId ? 'Update' : 'Save' }}
          </button>
        </div>
      </form>
    </p-dialog>

    <p-dialog [(visible)]="isOutreachModalVisible" [header]="editingOutreachId ? 'Edit Outreach Worker' : 'Create Outreach Worker'" [modal]="true" [dismissableMask]="true" [style]="{width: '500px'}">
      <form [formGroup]="outreachForm" (ngSubmit)="saveOutreach()" class="flex flex-col gap-4 pt-3">
        <div class="flex flex-col sm:flex-row items-center gap-4 mb-2 bg-base-200/30 p-4 rounded-2xl border border-base-200">
          <div class="avatar placeholder">
            <div class="bg-base-300 text-base-content/50 w-16 h-16 rounded-full flex items-center justify-center border-2 border-base-100 shadow-sm overflow-hidden">
              @if (selectedImage) {
                <span class="pi pi-check text-2xl text-success"></span>
              } @else if (selectedOutreach?.imageUrl) {
                <img [src]="selectedOutreach?.imageUrl" alt="Avatar" class="object-cover w-full h-full" />
              } @else {
                <span class="pi pi-user text-2xl"></span>
              }
            </div>
          </div>
          <div class="flex flex-col gap-1.5 flex-1 w-full">
            <label class="text-sm font-semibold text-base-content/90">Worker Photo</label>
            <input type="file" class="file-input file-input-bordered file-input-sm w-full bg-base-100" (change)="onFileSelected($event)" accept="image/*" />
            @if (selectedImage) { <div class="text-xs text-success mt-1 font-medium"><i class="pi pi-check-circle mr-1"></i>Selected: {{ selectedImage.name }}</div> }
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">First Name <span class="text-error">*</span></label>
            <input pInputText type="text" formControlName="firstName" placeholder="e.g. Jane" class="w-full" [ngClass]="{'border-error': outreachForm.get('firstName')?.invalid && outreachForm.get('firstName')?.touched}" />
            @if (outreachForm.get('firstName')?.invalid && outreachForm.get('firstName')?.touched) {
              <span class="text-xs text-error">First Name is required.</span>
            }
          </div>
          <div class="flex flex-col gap-1.5 w-full">
            <label class="text-sm font-semibold text-base-content/90">Last Name <span class="text-error">*</span></label>
            <input pInputText type="text" formControlName="lastName" placeholder="e.g. Doe" class="w-full" [ngClass]="{'border-error': outreachForm.get('lastName')?.invalid && outreachForm.get('lastName')?.touched}" />
            @if (outreachForm.get('lastName')?.invalid && outreachForm.get('lastName')?.touched) {
              <span class="text-xs text-error">Last Name is required.</span>
            }
          </div>
        </div>
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-sm font-semibold text-base-content/90">Nickname</label>
          <input pInputText type="text" formControlName="nickName" placeholder="e.g. Janey" class="w-full" />
        </div>
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-sm font-semibold text-base-content/90">Contact Info</label>
          <input pInputText type="text" formControlName="contact" placeholder="e.g. 012 345 678 or email" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-4 mt-2 border-t border-base-200">
          <button class="btn btn-ghost" type="button" (click)="cancelEditOutreach()">Cancel</button>
          <button class="btn btn-primary px-6" type="submit" [disabled]="outreachForm.invalid || busyOutreach">
            @if (busyOutreach) { <span class="loading loading-spinner loading-sm"></span> }
            {{ editingOutreachId ? 'Update' : 'Save' }}
          </button>
        </div>
      </form>
    </p-dialog>

    <p-dialog [(visible)]="isInterventionModalVisible" [header]="editingInterventionId ? 'Edit Intervention' : 'Log New Intervention'" [modal]="true" [dismissableMask]="true" [style]="{width: '550px'}">
      <form [formGroup]="interventionForm" (ngSubmit)="saveIntervention()" class="flex flex-col gap-4 pt-3">
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-sm font-semibold text-base-content/90">Target Student <span class="text-error">*</span></label>
          <div class="relative">
            <select pInputText formControlName="studentId" class="w-full appearance-none pr-8 cursor-pointer">
              <option value="" disabled>Select a student...</option>
              @for (s of students; track s.id) { <option [value]="s.id">{{ s.engFirstName }} {{ s.engLastName }}</option> }
            </select>
            <i class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none text-sm"></i>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-sm font-semibold text-base-content/90">Case Status <span class="text-error">*</span></label>
          <div class="relative">
            <select pInputText formControlName="status" class="w-full appearance-none pr-8 cursor-pointer">
              <option value="Open">Open (Requires Follow-up)</option>
              <option value="Investigating">Investigating / Pending</option>
              <option value="Resolved">Resolved / Closed</option>
            </select>
            <i class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none text-sm"></i>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 w-full">
          <label class="text-sm font-semibold text-base-content/90">Case Notes</label>
          <textarea class="textarea textarea-bordered w-full min-h-[120px] text-base" formControlName="notes" placeholder="Provide details regarding the home visit, parent contact, etc."></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-4 mt-2 border-t border-base-200">
          <button class="btn btn-ghost" type="button" (click)="cancelEditIntervention()">Cancel</button>
          <button class="btn btn-primary px-6" type="submit" [disabled]="interventionForm.invalid || busyIntervention">
            @if (busyIntervention) { <span class="loading loading-spinner loading-sm"></span> }
            {{ editingInterventionId ? 'Update' : 'Save Record' }}
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
  private readonly http = inject(HttpClient);
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

  protected readonly outreachForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    nickName: [''],
    contact: ['']
  });

  protected readonly interventionForm = this.fb.nonNullable.group({
    studentId: ['', [Validators.required]],
    status: ['Open', [Validators.required]],
    notes: ['']
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
    monthYear: [new Date(), [Validators.required]]
  });

  protected activeTab: 'classes' | 'students' | 'outreaches' | 'interventions' | 'products' | 'reports' | 'activity' = 'classes';
  
  protected isClassModalVisible = false;
  protected isStudentModalVisible = false;
  protected isProductModalVisible = false;
  protected editingClassId: string | null = null;
  protected selectedClass: ClassDto | null = null;
  protected editingStudentId: string | null = null;
  protected selectedStudent: StudentDto | null = null;
  protected isOutreachModalVisible = false;
  protected editingOutreachId: string | null = null;
  protected selectedOutreach: OutReachDto | null = null;
  protected isInterventionModalVisible = false;
  protected editingInterventionId: string | null = null;
  protected selectedIntervention: InterventionDto | null = null;
  protected editingProductId: string | null = null;
  protected selectedProduct: ProductDto | null = null;

  protected classes: ClassDto[] = [];
  protected students: StudentDto[] = [];
  protected outreaches: OutReachDto[] = [];
  protected interventions: InterventionDto[] = [];
  protected products: ProductDto[] = [];
  protected classOptions: LookupOption[] = [];
  protected outreachOptions: LookupOption[] = [];
  protected categoryOptions: LookupOption[] = [];
  protected brandOptions: LookupOption[] = [];
  protected activityLog: ActivityEntry[] = [];
  protected statusMessage = 'Ready';
  protected busyClass = false;
  protected busyStudent = false;
  protected busyOutreach = false;
  protected busyIntervention = false;
  protected busyProduct = false;
  protected reloadTrigger = 0; // Increment to force reload

  // Delete confirmation modal properties
  protected deleteItemName = '';
  protected deleteItemType = 'item';
  protected deleteItemId: string | null = null;
  protected deleteItemTypeEnum: 'class' | 'student' | 'outreach' | 'product' | 'intervention' | null = null;
  protected deletingInProgress = false;
  protected statusTone: 'success' | 'error' | 'info' = 'info';

  ngOnInit(): void {
    this.refreshAll();
  }

  protected openClassModal() {
    this.cancelEditClass();
    this.isClassModalVisible = true;
  }
  
  protected openStudentModal() {
    this.cancelEditStudent();
    this.isStudentModalVisible = true;
  }

  protected openOutreachModal() {
    this.cancelEditOutreach();
    this.isOutreachModalVisible = true;
  }

  protected openInterventionModal() {
    this.cancelEditIntervention();
    this.isInterventionModalVisible = true;
  }

  protected openProductModal() {
    this.cancelEditProduct();
    this.isProductModalVisible = true;
  }

  protected saveClass(): void {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    this.busyClass = true;
    const formValue = this.classForm.getRawValue();
    const payload: any = this.editingClassId && this.selectedClass
      ? { ...this.selectedClass, className: formValue.className.trim() }
      : { className: formValue.className.trim() };
    
    if (this.editingClassId) {
      payload.id = this.editingClassId;
    }
    
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
        // Handle Angular HttpErrorResponse parsing errors on successful 200/204 empty responses
        if (error?.status >= 200 && error?.status < 300) {
          this.cancelEditClass();
          this.loadClasses();
          this.loadLookups();
          this.announce(`Successfully saved class.`, 'success');
          return;
        }
        this.announce(this.extractMessage(error, 'Failed to save class.'), 'error');
      }
    });
    this.isStudentModalVisible = true;
  }

  protected editClass(item: ClassDto): void {
    this.editingClassId = item.id;
    this.selectedClass = item;
    this.classForm.patchValue({ className: item.className });
    this.isClassModalVisible = true;
  }

  protected cancelEditClass(): void {
    this.editingClassId = null;
    this.selectedClass = null;
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

  protected getClassName(id: string | null | undefined): string | null {
    if (!id) return null;
    return this.classOptions.find(c => c.value === id)?.label || null;
  }

  protected getOutreachName(id: string | null | undefined): string | null {
    if (!id) return null;
    return this.outreachOptions.find(o => o.value === id)?.label || null;
  }

  protected saveStudent(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.busyStudent = true;
    const value = this.studentForm.getRawValue();
    const payload: any = this.editingStudentId && this.selectedStudent
      ? { ...this.selectedStudent }
      : {};

    if (this.editingStudentId) {
      payload.id = this.editingStudentId;
    }

    payload.khFirstName = value.khFirstName.trim() || null;
    payload.khLastName = value.khLastName.trim() || null;
    payload.engFirstName = value.engFirstName.trim();
    payload.engLastName = value.engLastName.trim();
    payload.gender = value.gender;
    payload.dateOfBirth = value.dateOfBirth ? new Date(value.dateOfBirth).toISOString() : null;
    payload.classId = value.classId || null;
    payload.outReachId = value.outReachId || null;

    const obs$ = (this.editingStudentId 
      ? this.studentApi.update(this.editingStudentId, payload)
      : this.studentApi.create(payload)) as Observable<any>;

    obs$.pipe(
      finalize(() => {
        this.busyStudent = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (saved: any) => {
        const studentId = saved?.id || this.editingStudentId;
        if (this.selectedImage && studentId) {
          const formData = new FormData();
          formData.append('file', this.selectedImage);
          this.http.post(`http://localhost:5001/api/Student/${studentId}/image`, formData).subscribe();
        }
        
        this.cancelEditStudent();
        this.loadStudents();
        this.loadInterventions(); // Keep interventions tab synced with the updated student names
        this.announce(`Successfully saved student.`, 'success');
      },
      error: (error: any) => {
        if (error?.status >= 200 && error?.status < 300) {
          const studentId = this.editingStudentId;
          if (this.selectedImage && studentId) {
            const formData = new FormData();
            formData.append('file', this.selectedImage);
            this.http.post(`http://localhost:5001/api/Student/${studentId}/image`, formData).subscribe();
          }
          this.cancelEditStudent();
          this.loadStudents();
          this.loadInterventions(); // Keep interventions tab synced with the updated student names
          this.announce(`Successfully saved student.`, 'success');
          return;
        }
        this.announce(this.extractMessage(error, 'Failed to save student.'), 'error');
      }
    });
    this.isProductModalVisible = true;
  }

  protected editStudent(item: StudentDto): void {
    this.editingStudentId = item.id!;
    this.selectedStudent = item;
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
    this.isStudentModalVisible = true;
  }

  protected cancelEditStudent(): void {
    this.editingStudentId = null;
    this.selectedStudent = null;
    this.studentForm.reset({ khFirstName: '', khLastName: '', engFirstName: '', engLastName: '', gender: 'Male', dateOfBirth: '', classId: '', outReachId: '' });
    this.selectedImage = null;
    const fileInputs = document.querySelectorAll('.file-input');
    fileInputs.forEach(input => (input as HTMLInputElement).value = '');
    this.isStudentModalVisible = false;
  }

  protected deleteStudent(id: string, firstName: string, lastName: string): void {
    this.deleteItemId = id;
    this.deleteItemName = `${firstName} ${lastName}`;
    this.deleteItemType = 'student';
    this.deleteItemTypeEnum = 'student';
    this.openDeleteModal();
  }

  protected getStudentName(id: string): string {
    const student = this.students.find(s => s.id === id);
    return student ? `${student.engFirstName} ${student.engLastName}` : id;
  }

  protected toggleStudentStatus(item: any): void {
    const newStatus = item.isActive === false ? true : false;
    const payload = { ...item, isActive: newStatus };
    
    this.studentApi.update(item.id, payload).subscribe({
      next: () => {
        item.isActive = newStatus;
        this.announce(`Student marked as ${newStatus ? 'Active' : 'Inactive'}.`, 'success');
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        if (error?.status >= 200 && error?.status < 300) {
          item.isActive = newStatus;
          this.announce(`Student marked as ${newStatus ? 'Active' : 'Inactive'}.`, 'success');
          this.cdr.detectChanges();
          return;
        }
        this.announce(this.extractMessage(error, 'Failed to update student status.'), 'error');
      }
    });
  }

  protected saveOutreach(): void {
    if (this.outreachForm.invalid) {
      this.outreachForm.markAllAsTouched();
      return;
    }

    this.busyOutreach = true;
    const formValue = this.outreachForm.getRawValue();
    const payload: any = this.editingOutreachId && this.selectedOutreach
      ? { ...this.selectedOutreach }
      : {};
    
    if (this.editingOutreachId) payload.id = this.editingOutreachId;

    payload.firstName = formValue.firstName?.trim() || '';
    payload.lastName = formValue.lastName?.trim() || '';
    payload.nickName = formValue.nickName?.trim() || null;
    payload.contact = formValue.contact?.trim() || null;

    const obs$ = this.editingOutreachId
      ? this.http.put(`http://localhost:5001/api/outreach/${this.editingOutreachId}`, payload)
      : this.http.post('http://localhost:5001/api/outreach', payload);

    obs$.pipe(
      finalize(() => {
        setTimeout(() => {
          this.busyOutreach = false;
          this.cdr.detectChanges();
        });
      })
    ).subscribe({
      next: (saved: any) => {
        setTimeout(() => {
          const outreachId = saved?.id || this.editingOutreachId;
          if (this.selectedImage && outreachId) {
            const formData = new FormData();
            formData.append('file', this.selectedImage);
            this.http.post(`http://localhost:5001/api/outreach/${outreachId}/image`, formData).subscribe();
          }
          this.cancelEditOutreach();
          this.loadOutreaches();
          this.loadLookups();
          this.announce('Successfully saved outreach worker.', 'success');
        });
      },
      error: (err: any) => {
        setTimeout(() => {
          if (err?.status >= 200 && err?.status < 300) {
            const outreachId = this.editingOutreachId;
            if (this.selectedImage && outreachId) {
              const formData = new FormData();
              formData.append('file', this.selectedImage);
              this.http.post(`http://localhost:5001/api/outreach/${outreachId}/image`, formData).subscribe();
            }
            this.cancelEditOutreach();
            this.loadOutreaches();
            this.loadLookups();
            this.announce('Successfully saved outreach worker.', 'success');
            return;
          }
          this.announce(this.extractMessage(err, 'Failed to save outreach worker.'), 'error');
        });
      }
    });
  }

  protected editOutreach(item: OutReachDto): void {
    this.editingOutreachId = item.id || null;
    this.selectedOutreach = item;
    this.outreachForm.patchValue({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      nickName: item.nickName || '',
      contact: item.contact || ''
    });
    this.isOutreachModalVisible = true;
  }

  protected cancelEditOutreach(): void {
    this.editingOutreachId = null;
    this.selectedOutreach = null;
    this.outreachForm.reset({ firstName: '', lastName: '', nickName: '', contact: '' });
    this.selectedImage = null;
    const fileInputs = document.querySelectorAll('.file-input');
    fileInputs.forEach(input => (input as HTMLInputElement).value = '');
    this.isOutreachModalVisible = false;
  }

  protected deleteOutreach(id?: string, name?: string): void {
    if (!id) return;
    this.deleteItemId = id;
    this.deleteItemName = name || 'this outreach worker';
    this.deleteItemType = 'outreach';
    this.deleteItemTypeEnum = 'outreach';
    this.openDeleteModal();
  }

  protected saveIntervention(): void {
    if (this.interventionForm.invalid) {
      this.interventionForm.markAllAsTouched();
      return;
    }

    this.busyIntervention = true;
    const formValue = this.interventionForm.getRawValue();
    const payload: any = this.editingInterventionId && this.selectedIntervention
      ? { ...this.selectedIntervention, ...formValue }
      : { ...formValue, dateReported: new Date().toISOString() };
    
    if (this.editingInterventionId) payload.id = this.editingInterventionId;

    const obs$ = this.editingInterventionId
      ? this.http.put(`http://localhost:5001/api/interventions/${this.editingInterventionId}`, payload)
      : this.http.post('http://localhost:5001/api/interventions', payload);

    obs$.pipe(
      finalize(() => {
        this.busyIntervention = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.cancelEditIntervention();
        this.loadInterventions();
        this.announce('Successfully saved intervention.', 'success');
      },
      error: (err: any) => {
        if (err?.status >= 200 && err?.status < 300) {
          this.cancelEditIntervention();
          this.loadInterventions();
          this.announce('Successfully saved intervention.', 'success');
          return;
        }
        this.announce(this.extractMessage(err, 'Failed to save intervention.'), 'error');
      }
    });
  }

  protected editIntervention(item: InterventionDto): void {
    this.editingInterventionId = item.id || null;
    this.selectedIntervention = item;
    this.interventionForm.patchValue({
      studentId: item.studentId,
      status: item.status || 'Open',
      notes: item.notes || ''
    });
    this.isInterventionModalVisible = true;
  }

  protected cancelEditIntervention(): void {
    this.editingInterventionId = null;
    this.selectedIntervention = null;
    this.interventionForm.reset({ studentId: '', status: 'Open', notes: '' });
    this.isInterventionModalVisible = false;
  }

  protected deleteIntervention(id?: string): void {
    if (!id) return;
    this.deleteItemId = id;
    this.deleteItemName = 'this intervention record';
    this.deleteItemType = 'intervention';
    this.deleteItemTypeEnum = 'intervention';
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

    const payload: any = this.editingProductId && this.selectedProduct
      ? { ...this.selectedProduct }
      : {};

    if (this.editingProductId) {
      payload.id = this.editingProductId;
    }

    payload.name = value.name?.trim() || '';
    payload.codeNumber = value.codeNumber?.trim() || null;
    payload.description = value.description?.trim() || null;
    payload.categoryId = value.categoryId || null;
    payload.brandId = value.brandId || null;
    payload.price = parsedPrice;
    payload.quality = value.quality?.trim() || null;
    payload.voucherNumber = value.voucherNumber?.trim() || null;

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
        const productId = saved?.id || this.editingProductId;
        if (this.selectedImage && productId) {
          this.productApi.uploadImage(productId, this.selectedImage).subscribe();
        }
        this.cancelEditProduct();
        this.loadProducts();
        this.announce(`Successfully saved product.`, 'success');
      },
      error: (error: any) => {
        if (error?.status >= 200 && error?.status < 300) {
          const productId = this.editingProductId;
          if (this.selectedImage && productId) {
            this.productApi.uploadImage(productId, this.selectedImage).subscribe();
          }
          this.cancelEditProduct();
          this.loadProducts();
          this.announce(`Successfully saved product.`, 'success');
          return;
        }
        const errorMsg = error?.error?.message ?? error?.message ?? 'Failed to create product.';
        this.announce(this.extractMessage(error, errorMsg), 'error');
      }
    });
  }

  protected editProduct(item: ProductDto): void {
    this.editingProductId = item.id!;
    this.selectedProduct = item;
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
    this.isProductModalVisible = true;
  }

  protected cancelEditProduct(): void {
    this.editingProductId = null;
    this.selectedProduct = null;
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
    const selectedDate = this.reportForm.getRawValue().monthYear as Date;
    if (!selectedDate) return;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    this.reportApi.downloadMonthlyPdf(year, month).subscribe({
      next: (blob) => this.saveBlob(blob, `monthly-transactions-${year}-${month}.pdf`),
      error: (error: any) => this.announce(this.extractMessage(error, 'PDF generation failed.'), 'error')
    });
  }

  protected downloadMonthlyExcel(): void {
    const selectedDate = this.reportForm.getRawValue().monthYear as Date;
    if (!selectedDate) return;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    this.reportApi.downloadMonthlyExcel(year, month).subscribe({
      next: (blob) => this.saveBlob(blob, `monthly-transactions-${year}-${month}.xlsx`),
      error: (error: any) => this.announce(this.extractMessage(error, 'Excel generation failed.'), 'error')
    });
  }

  protected queueMonthly(): void {
    const selectedDate = this.reportForm.getRawValue().monthYear as Date;
    if (!selectedDate) return;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    this.reportApi.enqueueMonthly(year, month).subscribe({
      next: (result: any) => this.announce(result?.message || 'Report queued successfully.', 'success'),
      error: (error: any) => this.announce(this.extractMessage(error, 'Failed to queue report.'), 'error')
    });
  }

  private refreshAll(): void {
    this.loadLookups();
    this.loadClasses();
    this.loadStudents();
    this.loadOutreaches();
    this.loadInterventions();
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

  protected loadOutreaches(): void {
    this.http.get<any>('http://localhost:5001/api/outreach').pipe(
      catchError(() => of({ items: [] })),
      finalize(() => { 
        setTimeout(() => this.cdr.detectChanges()); 
      })
    ).subscribe({
      next: (data) => {
        this.outreaches = data.items || data || [];
      }
    });
  }

  protected loadInterventions(): void {
    this.http.get<InterventionDto[]>('http://localhost:5001/api/interventions').pipe(
      catchError(() => of([] as InterventionDto[])),
      finalize(() => { 
        setTimeout(() => this.cdr.detectChanges()); 
      })
    ).subscribe({
      next: (data) => {
        this.interventions = data;
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
      case 'outreach':
        this.performDeleteOutreach(this.deleteItemId);
        break;
      case 'intervention':
        this.performDeleteIntervention(this.deleteItemId);
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
        if (error?.status >= 200 && error?.status < 300) {
          this.announce('Class deleted.', 'success');
          this.closeDeleteModal();
          setTimeout(() => { this.loadClasses(); this.loadLookups(); }, 200);
          return;
        }
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
        setTimeout(() => { 
          this.loadStudents(); 
          this.loadInterventions(); // Refresh interventions in case of cascading deletes!
        }, 200);
      },
      error: (error: any) => {
        if (error?.status >= 200 && error?.status < 300) {
          this.announce('Student deleted.', 'success');
          this.closeDeleteModal();
          setTimeout(() => { 
            this.loadStudents(); 
            this.loadInterventions(); // Refresh interventions in case of cascading deletes!
          }, 200);
          return;
        }
        this.announce(this.extractMessage(error, 'Failed to delete student. They may have active records.'), 'error');
        this.closeDeleteModal();
      }
    });
  }

  private performDeleteOutreach(id: string): void {
    this.http.delete(`http://localhost:5001/api/outreach/${id}`).subscribe({
      next: () => {
        this.announce('Outreach worker deleted.', 'success');
        this.closeDeleteModal();
        setTimeout(() => { this.loadOutreaches(); this.loadLookups(); }, 200);
      },
      error: (error: any) => {
        if (error?.status >= 200 && error?.status < 300) {
          this.announce('Outreach worker deleted.', 'success');
          this.closeDeleteModal();
          setTimeout(() => { this.loadOutreaches(); this.loadLookups(); }, 200);
          return;
        }
        this.announce(this.extractMessage(error, 'Failed to delete outreach worker.'), 'error');
        this.closeDeleteModal();
      }
    });
  }

  private performDeleteIntervention(id: string): void {
    this.http.delete(`http://localhost:5001/api/interventions/${id}`).subscribe({
      next: () => {
        this.announce('Intervention deleted.', 'success');
        this.closeDeleteModal();
        setTimeout(() => this.loadInterventions(), 200);
      },
      error: (error: any) => {
        if (error?.status >= 200 && error?.status < 300) {
          this.announce('Intervention deleted.', 'success');
          this.closeDeleteModal();
          setTimeout(() => this.loadInterventions(), 200);
          return;
        }
        this.announce(this.extractMessage(error, 'Failed to delete intervention.'), 'error');
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
        if (error?.status >= 200 && error?.status < 300) {
          this.announce('Product deleted.', 'success');
          this.closeDeleteModal();
          setTimeout(() => this.loadProducts(), 200);
          return;
        }
        this.announce(this.extractMessage(error, 'Failed to delete product.'), 'error');
        this.closeDeleteModal();
      }
    });
  }
}
