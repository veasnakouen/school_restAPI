import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupplierApiService, SupplierDto } from '../../core/services/supplier-api.service';
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
  selector: 'app-suppliers',
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
            <p-badge [value]="suppliers.length + ' visible'" severity="secondary"></p-badge>
          </div>
          <h2 class="section-title text-base-content">Suppliers</h2>
          <p class="max-w-2xl text-sm text-base-content/65">Manage product suppliers.</p>
        </div>

        <button pButton label="Add Supplier" icon="pi pi-plus" (click)="showAddDialog()"></button>
      </div>

      <div class="my-6 shadow-sm rounded-lg overflow-hidden border border-base-300 bg-base-100">
        <p-table [value]="suppliers" [loading]="loading" [paginator]="true" [rows]="10" [scrollable]="true" scrollHeight="400px" styleClass="p-datatable-striped p-datatable-sm [&_td]:!px-4 [&_td]:!py-3" [tableStyle]="{'min-width': '30rem'}">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td class="font-medium">{{ item.name }}</td>
              <td class="text-right">
                <p-button icon="pi pi-pencil" [text]="true" severity="secondary" (onClick)="editSupplier(item)"></p-button>
                <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="confirmDelete(item.id!, item.name)"></p-button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="2" class="py-10 text-center text-base-content/70">No suppliers found.</td>
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
    <p-dialog [(visible)]="showDialog" [header]="editingSupplier?.id ? 'Edit Supplier' : 'Add Supplier'" [modal]="true" [style]="{width: '350px'}">
      <div *ngIf="editingSupplier" class="space-y-3">
        <div>
          <label class="block text-xs font-medium mb-1">Name <span class="text-red-500">*</span></label>
          <input pInputText [(ngModel)]="editingSupplier.name" class="w-full p-inputtext-sm" />
        </div>
        <div class="flex justify-end gap-2 pt-3">
          <button pButton type="button" label="Cancel" severity="secondary" (click)="closeDialog()"></button>
          <button pButton label="Save" (click)="saveSupplier()"></button>
        </div>
      </div>
    </p-dialog>
  `
})
export class SuppliersComponent implements OnInit {
  private readonly api = inject(SupplierApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmationService = inject(ConfirmationService);

  protected suppliers: SupplierDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected showDialog = false;
  protected editingSupplier: SupplierDto | null = null;

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.cdr.detectChanges();
    (this.api.list() as any).subscribe({
      next: (data: SupplierDto[]) => { this.suppliers = data || []; },
      error: () => this.errorMessage = 'Failed to load suppliers',
      complete: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  showAddDialog() {
    this.editingSupplier = { name: '' };
    this.showDialog = true;
  }

  editSupplier(supplier: SupplierDto) {
    this.editingSupplier = { ...supplier };
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.editingSupplier = null;
  }

  saveSupplier() {
    if (!this.editingSupplier || !this.editingSupplier.name) return;
    this.loading = true;
    this.cdr.detectChanges();
    const isEdit = !!this.editingSupplier.id;
    const saveObs = isEdit
      ? this.api.update(this.editingSupplier.id!, this.editingSupplier)
      : this.api.create(this.editingSupplier);
    (saveObs as any).subscribe({
      next: () => { this.closeDialog(); this.load(); },
      error: () => this.errorMessage = 'Failed to save supplier',
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
          error: () => this.errorMessage = 'Failed to delete supplier',
          complete: () => { this.loading = false; this.cdr.detectChanges(); }
        });
      }
    });
  }
}