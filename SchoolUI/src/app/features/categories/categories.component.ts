import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryApiService } from '../../core/services/category-api.service';
import { CategoryDto } from '../../models/inventory.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { finalize } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective, TableModule, InputTextModule, ButtonModule, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <h2 class="section-title text-base-content">Categories</h2>
          <p class="text-sm text-base-content/65">Manage product categories.</p>
        </div>
      </div>

      <!-- Add/Edit Form -->
      @if (editingCategory) {
        <form class="rounded-[20px] border border-primary/50 bg-primary/5 p-4 shadow-lg" (ngSubmit)="saveCategory()">
          <div class="flex gap-3 items-center">
            <input pInputText [(ngModel)]="editingCategory.name" name="name" placeholder="Category Name" class="flex-1 p-inputtext-sm" required />
            <button pButton type="button" label="Cancel" severity="secondary" (click)="cancelEdit()"></button>
            <button pButton type="submit" label="Save" [disabled]="!editingCategory.name"></button>
          </div>
        </form>
      } @else {
        <form class="rounded-[20px] border border-base-300/70 bg-base-100/70 p-4 shadow-lg" (ngSubmit)="addCategory()">
          <div class="flex gap-3">
            <input pInputText [(ngModel)]="newCategoryName" name="name" placeholder="New Category Name" class="flex-1 p-inputtext-sm" required />
            <button pButton type="submit" label="Add" [disabled]="!newCategoryName"></button>
          </div>
        </form>
      }

      <!-- List -->
      <div class="my-6 shadow-sm rounded-[24px] overflow-hidden border border-base-300/70 bg-base-100/70">
        <p-table [value]="categories" styleClass="p-datatable-striped p-datatable-sm [&_td]:!px-4 [&_td]:!py-3" [tableStyle]="{'min-width': '50rem'}">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td class="font-medium">{{ item.name }}</td>
              <td class="font-mono text-xs text-base-content/60">{{ item.id }}</td>
              <td class="text-right">
                <p-button icon="pi pi-pencil" [text]="true" severity="secondary" (onClick)="editCategory(item)"></p-button>
                <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="confirmDelete(item.id!, item.name)"></p-button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="3" class="py-6 text-center text-base-content/60">No categories found.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </section>
  `
})
export class CategoriesComponent implements OnInit {
  private readonly api = inject(CategoryApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmationService = inject(ConfirmationService);

  categories: CategoryDto[] = [];
  newCategoryName = '';
  editingCategory: CategoryDto | null = null;

  ngOnInit(): void { this.load(); }

  load() {
    this.api.list().pipe(
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: (res) => this.categories = res
    });
  }

  addCategory() {
    if (!this.newCategoryName) return;
    this.api.create({ name: this.newCategoryName }).pipe(
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: () => { this.newCategoryName = ''; this.load(); }
    });
  }

  editCategory(category: CategoryDto) {
    this.editingCategory = { ...category };
  }

  cancelEdit() {
    this.editingCategory = null;
  }

  saveCategory() {
    if (!this.editingCategory || !this.editingCategory.id) return;
    this.api.update(this.editingCategory.id, this.editingCategory).pipe(
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: () => { this.editingCategory = null; this.load(); }
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
        this.api.delete(id).subscribe({
          next: () => this.load(),
          error: () => this.cdr.detectChanges()
        });
      }
    });
  }
}
