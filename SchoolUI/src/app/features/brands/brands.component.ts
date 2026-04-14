import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrandApiService } from '../../core/services/brand-api.service';
import { BrandDto } from '../../models/inventory.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective],
  template: `
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <h2 class="section-title text-base-content">Brands</h2>
          <p class="text-sm text-base-content/65">Manage product brands.</p>
        </div>
      </div>

      <!-- Add Form -->
      <form class="rounded-[20px] border border-base-300/70 bg-base-100/70 p-4 shadow-lg" (ngSubmit)="addBrand()">
        <div class="flex gap-3">
          <input [(ngModel)]="newBrandName" name="name" placeholder="New Brand Name" class="app-input flex-1" required />
          <button type="submit" class="btn btn-primary" [disabled]="!newBrandName">Add</button>
        </div>
      </form>

      <!-- List -->
      <div class="overflow-hidden rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg my-6 px-4">
        <table class="table table-zebra table-pin-rows">
          <thead><tr><th>Name</th><th>ID</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            @for (item of brands; track item.id) {
              <tr>
                <td class="font-medium">{{ item.name }}</td>
                <td class="font-mono text-xs text-base-content/60">{{ item.id }}</td>
                <td class="text-right">
                  <button class="btn btn-ghost btn-xs text-error" (click)="openDeleteModal(item.id!, item.name)">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="py-6 text-center text-base-content/60">No brands found.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- Delete Confirmation Modal -->
    <dialog id="brand-delete-modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box max-w-md py-6">
        <div class="flex flex-col items-center text-center">
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
            <span class="pi pi-exclamation-triangle text-2xl text-error"></span>
          </div>
          <h3 class="mb-2 text-xl font-bold text-base-content">Confirm Deletion</h3>
          <p class="mb-5 text-base text-base-content/70">
            Are you sure you want to delete <strong class="text-base-content">{{ deleteItemName }}</strong>?
          </p>
          <div class="flex w-full gap-3">
            <button class="btn btn-ghost flex-1" type="button" (click)="closeDeleteModal()">Cancel</button>
            <button class="btn btn-error flex-1" type="button" [class.loading]="deletingInProgress" (click)="confirmDelete()">
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
export class BrandsComponent implements OnInit {
  private readonly api = inject(BrandApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  brands: BrandDto[] = [];
  newBrandName = '';
  
  // Delete modal properties
  deleteItemId: string | null = null;
  deleteItemName = '';
  deletingInProgress = false;

  ngOnInit(): void { this.load(); }

  load() {
    this.api.list().pipe(
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: (res) => this.brands = res
    });
  }

  addBrand() {
    if (!this.newBrandName) return;
    this.api.create({ name: this.newBrandName }).pipe(
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: () => { this.newBrandName = ''; this.load(); }
    });
  }

  openDeleteModal(id: string, name: string) {
    this.deleteItemId = id;
    this.deleteItemName = name;
    const modal = document.getElementById('brand-delete-modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  closeDeleteModal() {
    const modal = document.getElementById('brand-delete-modal') as HTMLDialogElement;
    if (modal) modal.close();
    this.deleteItemId = null;
    this.deleteItemName = '';
    this.deletingInProgress = false;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (!this.deleteItemId) return;
    this.deletingInProgress = true;
    this.cdr.detectChanges();
    
    this.api.delete(this.deleteItemId).pipe(
      finalize(() => {
        this.closeDeleteModal();
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => this.load(),
      error: (error) => {
        console.error('Failed to delete brand:', error);
        this.deletingInProgress = false;
        this.cdr.detectChanges();
      }
    });
  }
}
