import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DepartmentApiService, DepartmentDto } from '../../core/services/department-api.service';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, SharedModule } from 'primeng/api';

@Component({
  selector: 'app-departments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective, TableModule, InputTextModule, BadgeModule, ButtonModule, DialogModule, ConfirmDialogModule, ToastModule, SharedModule],
  providers: [ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <p-badge value="Inventory" severity="info"></p-badge>
            <p-badge [value]="filteredDepartments.length + ' visible'" severity="secondary"></p-badge>
          </div>
          <h2 class="section-title text-base-content">Departments</h2>
          <p class="max-w-2xl text-sm text-base-content/65">Manage departments.</p>
        </div>

        <div class="flex gap-2 items-end flex-wrap">
          <div class="w-full max-w-md relative">
            <div class="pb-2"><span class="text-sm font-semibold text-base-content/80">Search</span></div>
            <i class="pi pi-search absolute right-3 top-[36px] text-base-content/50"></i>
            <input pInputText [(ngModel)]="search" placeholder="Search..." class="w-full p-inputtext-sm pr-10" />
          </div>
          <button pButton label="Add Department" icon="pi pi-plus" (click)="showAddDialog()"></button>
        </div>
      </div>

      <div class="my-6 shadow-sm rounded-lg overflow-hidden border border-base-300 bg-base-100">
        <p-table [value]="filteredDepartments" [globalFilterFields]="['name', 'location']" [loading]="loading" [paginator]="true" [rows]="10" [scrollable]="true" scrollHeight="400px" styleClass="p-datatable-striped p-datatable-sm [&_td]:!px-4 [&_td]:!py-3" [tableStyle]="{'min-width': '40rem'}">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Created</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td class="font-medium">{{ item.name }}</td>
              <td>{{ item.location || '-' }}</td>
              <td>{{ item.createdDate | date:'mediumDate' }}</td>
              <td class="text-right">
                <p-button icon="pi pi-pencil" [text]="true" severity="secondary" (onClick)="editDepartment(item)"></p-button>
                <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="confirmDelete(item.id!, item.name)"></p-button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="py-10 text-center text-base-content/70">No departments found.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      @if (errorMessage) {
        <div class="alert alert-error shadow-lg">
          <span class="pi pi-exclamation-circle"></span>
          <span>{{ errorMessage }}</span>
        </div>
      }
    </section>

    <!-- Add/Edit Dialog -->
    <p-dialog [(visible)]="showDialog" [header]="editingDepartment?.id ? 'Edit Department' : 'Add Department'" [modal]="true" [style]="{width: '400px'}">
      <div *ngIf="editingDepartment" class="space-y-3">
        <div>
          <label class="block text-xs font-medium mb-1">Name <span class="text-red-500">*</span></label>
          <input pInputText [(ngModel)]="editingDepartment.name" class="w-full p-inputtext-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1">Location</label>
          <input pInputText [(ngModel)]="editingDepartment.location" class="w-full p-inputtext-sm" />
        </div>
        <div class="flex justify-end gap-2 pt-3">
          <button pButton type="button" label="Cancel" severity="secondary" (click)="closeDialog()"></button>
          <button pButton label="Save" (click)="saveDepartment()"></button>
        </div>
      </div>
    </p-dialog>
  `
})
export class DepartmentsComponent implements OnInit {
  private readonly api = inject(DepartmentApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmationService = inject(ConfirmationService);

  protected departments: DepartmentDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected search = '';
  protected showDialog = false;
  protected editingDepartment: DepartmentDto | null = null;

  protected get filteredDepartments(): DepartmentDto[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.departments;
    return this.departments.filter(d => d.name?.toLowerCase().includes(term) || d.location?.toLowerCase().includes(term));
  }

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.cdr.detectChanges();
    (this.api.list() as any).subscribe({
      next: (data: DepartmentDto[]) => { this.departments = data || []; },
      error: () => this.errorMessage = 'Failed to load departments',
      complete: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  showAddDialog() {
    this.editingDepartment = { name: '', location: '' };
    this.showDialog = true;
  }

  editDepartment(dept: DepartmentDto) {
    this.editingDepartment = { ...dept };
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.editingDepartment = null;
  }

  saveDepartment() {
    if (!this.editingDepartment || !this.editingDepartment.name) return;
    this.loading = true;
    this.cdr.detectChanges();
    const isEdit = !!this.editingDepartment.id;
    const saveObs = isEdit
      ? this.api.update(this.editingDepartment.id!, this.editingDepartment)
      : this.api.create(this.editingDepartment);
    (saveObs as any).subscribe({
      next: () => { this.closeDialog(); this.load(); },
      error: () => this.errorMessage = 'Failed to save department',
      complete: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  confirmDelete(id: string, name: string) {
    this.confirmationService.confirm({
      message: 'Delete "' + name + '"?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancel', severity: 'secondary' },
      acceptButtonProps: { label: 'Delete', severity: 'danger' },
      accept: () => {
        this.loading = true;
        this.cdr.detectChanges();
        (this.api.delete(id) as any).subscribe({
          next: () => this.load(),
          error: () => this.errorMessage = 'Failed to delete department',
          complete: () => { this.loading = false; this.cdr.detectChanges(); }
        });
      }
    });
  }
}