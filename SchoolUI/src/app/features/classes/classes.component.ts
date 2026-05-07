import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassApiService } from '../../core/services/class-api.service';
import { ClassDto } from '../../models/academic.model';
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
  selector: 'app-classes',
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
            <p-badge value="Academics" severity="info"></p-badge>
            <p-badge [value]="filteredClasses.length + ' visible'" severity="secondary"></p-badge>
          </div>
          <h2 class="section-title text-base-content">Classes</h2>
          <p class="max-w-2xl text-sm text-base-content/65">Browse and manage academic classes.</p>
        </div>

        <div class="flex gap-2">
          <div class="form-control w-full max-w-md">
            <div class="label pb-2"><span class="label-text text-sm font-semibold text-base-content/80">Search classes</span></div>
            <input pInputText [(ngModel)]="search" placeholder="Search classes..." class="w-full p-inputtext-sm" />
          </div>
        </div>
      </div>

      <!-- Add/Edit Form -->
      @if (editingClass) {
        <form class="rounded-[20px] border border-primary/50 bg-primary/5 p-4 shadow-lg" (ngSubmit)="saveClass()">
          <div class="flex gap-3 items-center flex-wrap">
            <input pInputText [(ngModel)]="editingClass.className" name="className" placeholder="Class Name" class="flex-1 p-inputtext-sm min-w-48" required />
            <button pButton type="button" label="Cancel" severity="secondary" (click)="cancelEdit()"></button>
            <button pButton type="submit" label="Save" [disabled]="!editingClass.className"></button>
          </div>
        </form>
      } @else {
        <form class="rounded-[20px] border border-base-300/70 bg-base-100/70 p-4 shadow-lg" (ngSubmit)="addClass()">
          <div class="flex gap-3">
            <input pInputText [(ngModel)]="newClassName" name="className" placeholder="New Class Name" class="flex-1 p-inputtext-sm min-w-48" required />
            <button pButton type="submit" label="Add Class" [disabled]="!newClassName"></button>
          </div>
        </form>
      }

      <div class="my-6 shadow-sm rounded-[24px] overflow-hidden border border-base-300/70 bg-base-100/70">
        <p-table [value]="filteredClasses" [loading]="loading" [globalFilterFields]="['className', 'id']" styleClass="p-datatable-striped p-datatable-sm [&_td]:!px-4 [&_td]:!py-3" [tableStyle]="{'min-width': '30rem'}">
          <ng-template pTemplate="header">
            <tr>
              <th>Class Name</th>
              <th>Students</th>
              <th>ID</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td class="font-medium">{{ item.className }}</td>
              <td>{{ item.students?.length || 0 }}</td>
              <td class="font-mono text-xs text-base-content/60">{{ item.id }}</td>
              <td class="text-right">
                <p-button icon="pi pi-pencil" [text]="true" severity="secondary" (onClick)="editClass(item)"></p-button>
                <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="confirmDelete(item.id!, item.className)"></p-button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="3" class="py-10 text-center text-base-content/60">No classes match your search.</td>
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
  `
})
export class ClassesComponent implements OnInit {
  private readonly api = inject(ClassApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmationService = inject(ConfirmationService);

  protected classes: ClassDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected search = '';
  protected newClassName = '';
  protected editingClass: ClassDto | null = null;

  protected get filteredClasses(): ClassDto[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.classes;
    }

    return this.classes.filter((item) => item.className?.toLowerCase().includes(term) || item.id?.toLowerCase().includes(term));
  }

  ngOnInit(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
    this.api.list({ pageSize: 100 }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (result) => {
        this.classes = result.items || [];
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to load classes';
      }
    });
  }

  addClass() {
    if (!this.newClassName) return;
    this.loading = true;
    this.cdr.detectChanges();
    this.api.create({ className: this.newClassName }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => { this.newClassName = ''; this.load(); },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to create class';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  editClass(cls: ClassDto) {
    this.editingClass = { ...cls };
  }

  cancelEdit() {
    this.editingClass = null;
  }

  saveClass() {
    if (!this.editingClass || !this.editingClass.id) return;
    this.loading = true;
    this.cdr.detectChanges();
    this.api.update(this.editingClass.id, this.editingClass).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => { this.editingClass = null; this.load(); },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to update class';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmDelete(id: string, name: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete "' + name + '"?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancel', severity: 'secondary' },
      acceptButtonProps: { label: 'Delete', severity: 'danger' },
      accept: () => {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.delete(id).pipe(
          finalize(() => {
            this.loading = false;
            this.cdr.detectChanges();
          })
        ).subscribe({
          next: () => this.load(),
          error: (err) => {
            this.errorMessage = err.message || 'Failed to delete class';
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  private load() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
    this.api.list({ pageSize: 100 }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (result) => {
        this.classes = result.items || [];
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Unable to load classes.';
        this.classes = [];
        this.cdr.detectChanges();
      }
    });
  }
}
