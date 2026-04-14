import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductApiService } from '../../core/services/product-api.service';
import { CategoryApiService } from '../../core/services/category-api.service';
import { ProductDto, CreateProductRequest, CategoryDto } from '../../models/inventory.model';
import { QueryOptions } from '../../models/paging.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { finalize } from 'rxjs/operators';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective],
  template: `
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-primary badge-outline">Inventory</span>
            <span class="badge badge-ghost">{{ totalItems }} total</span>
          </div>
          <h2 class="section-title text-base-content">Products</h2>
          <p class="max-w-2xl text-sm text-base-content/65">Inventory items from the API.</p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input
            [(ngModel)]="search"
            (ngModelChange)="onSearchChange()"
            placeholder="Search products"
            class="input input-bordered w-full max-w-md"
          />
          <select
            [(ngModel)]="filterCategory"
            (ngModelChange)="onFilterChange()"
            class="select select-bordered w-full max-w-xs"
          >
            <option value="">All Categories</option>
            @for (cat of categories; track cat.id) {
              <option [value]="cat.name">{{ cat.name }}</option>
            }
          </select>
          <button type="button" class="btn btn-primary gap-2" (click)="openCreateModal()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Add Product
          </button>
        </div>

        <!-- Export Buttons -->
        <div class="flex flex-wrap gap-2 items-center">
          <div class="dropdown">
            <div tabindex="0" role="button" class="btn btn-sm btn-outline gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-40 p-2 shadow-lg border border-base-300">
              <li>
                <button type="button" (click)="exportToCSV()" [disabled]="products.length === 0" class="gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
              </li>
              <li>
                <button type="button" (click)="exportToPDF()" [disabled]="products.length === 0" class="gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>
              </li>
              <li>
                <button type="button" (click)="printProducts()" [disabled]="products.length === 0" class="gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg my-6">
        <div class="overflow-x-auto px-4">
          <table class="table table-zebra table-pin-rows">
            <thead>
              <tr>
                <th class="text-base font-bold cursor-pointer hover:bg-base-200 transition-colors" (click)="sortTable('name')">
                  <div class="flex items-center gap-1">
                    Name
                    @if (sortBy === 'name') {
                      <span class="text-xs">{{ isAscending ? '↑' : '↓' }}</span>
                    }
                  </div>
                </th>
                <th class="text-base font-bold cursor-pointer hover:bg-base-200 transition-colors" (click)="sortTable('category')">
                  <div class="flex items-center gap-1">
                    Category
                    @if (sortBy === 'category') {
                      <span class="text-xs">{{ isAscending ? '↑' : '↓' }}</span>
                    }
                  </div>
                </th>
                <th class="text-base font-bold cursor-pointer hover:bg-base-200 transition-colors" (click)="sortTable('brand')">
                  <div class="flex items-center gap-1">
                    Brand
                    @if (sortBy === 'brand') {
                      <span class="text-xs">{{ isAscending ? '↑' : '↓' }}</span>
                    }
                  </div>
                </th>
                <th class="text-base font-bold cursor-pointer hover:bg-base-200 transition-colors" (click)="sortTable('price')">
                  <div class="flex items-center gap-1">
                    Price
                    @if (sortBy === 'price') {
                      <span class="text-xs">{{ isAscending ? '↑' : '↓' }}</span>
                    }
                  </div>
                </th>
                <th class="text-center text-base font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of products; track item.id) {
                <tr>
                  <td class="font-medium">{{ item.name }}</td>
                  <td>{{ item.categoryName || '-' }}</td>
                  <td>{{ item.brandName || '-' }}</td>
                  <td>{{ item.price | number:'1.2-2' }}</td>
                  <td>
                    <div class="flex gap-2 justify-center">
                      <div class="tooltip tooltip-top" data-tip="View Product">
                        <button
                          type="button"
                          aria-label="View product"
                          class="btn btn-info btn-sm btn-square text-primary-content"
                          (click)="openViewModal(item)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                      <div class="tooltip tooltip-top" data-tip="Edit Product">
                        <button
                          type="button"
                          aria-label="Edit product"
                          class="btn btn-warning btn-sm btn-square text-primary-content"
                          (click)="openEditModal(item)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                      <div class="tooltip tooltip-top" data-tip="Delete Product">
                        <button
                          type="button"
                          aria-label="Delete product"
                          class="btn btn-error btn-sm btn-square text-error-content"
                          (click)="confirmDelete(item)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-10 text-center text-base-content/60">No products match your search.</td>
                </tr>
              }
            </tbody>
            <tfoot *ngIf="totalItems > 0">
              <tr>
                <td colspan="5" class="p-0 border-t border-base-200">
                  <div class="px-4 py-4 w-full bg-base-100">
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <!-- Rows per page selector (Left) -->
                      <div class="flex items-center gap-2 flex-1 sm:flex-initial">
                        <span class="text-sm opacity-70">Rows per page:</span>
                        <select
                          [(ngModel)]="pageSize"
                          (ngModelChange)="onPageSizeChange($event)"
                          class="select select-bordered select-sm"
                        >
                          <option [ngValue]="5">5</option>
                          <option [ngValue]="10">10</option>
                          <option [ngValue]="20">20</option>
                          <option [ngValue]="50">50</option>
                          <option [ngValue]="100">100</option>
                        </select>
                      </div>

                      <!-- Page Info (Center) -->
                      <div class="text-sm opacity-70 text-center">
                        Showing {{ startIndex }}-{{ endIndex }} of {{ totalItems }} products
                      </div>

                      <!-- Pagination Controls (Right) -->
                      <div class="join bg-base-200 flex-1 sm:flex-initial sm:justify-end" *ngIf="totalPages > 1">
                        <!-- First Page -->
                        <button
                          type="button"
                          class="join-item btn btn-sm btn-ghost"
                          aria-label="Go to first page"
                          (click)="goToFirstPage()"
                          [disabled]="currentPage === 1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                        </button>

                        <!-- Previous Page -->
                        <button
                          type="button"
                          class="join-item btn btn-sm btn-ghost"
                          aria-label="Go to previous page"
                          (click)="previousPage()"
                          [disabled]="currentPage === 1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <!-- Page Numbers -->
                        @for (page of visiblePages; track page) {
                          @if (page === '...') {
                            <span class="join-item btn btn-sm btn-disabled">...</span>
                          } @else {
                            <button
                              type="button"
                              class="join-item btn btn-sm"
                              [class.btn-active]="page === currentPage"
                              (click)="goToPage(+page)"
                            >
                              {{ page }}
                            </button>
                          }
                        }

                        <!-- Next Page -->
                        <button
                          type="button"
                          class="join-item btn btn-sm btn-ghost"
                          aria-label="Go to next page"
                          (click)="nextPage()"
                          [disabled]="currentPage === totalPages"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <!-- Last Page -->
                        <button
                          type="button"
                          class="join-item btn btn-sm btn-ghost"
                          aria-label="Go to last page"
                          (click)="goToLastPage()"
                          [disabled]="currentPage === totalPages"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      @if (loading) {
        <div class="alert alert-info border-0 bg-info/10 text-info">Loading products...</div>
      }
      @if (errorMessage) {
        <div class="alert alert-error border-0 bg-error/10 text-error">{{ errorMessage }}</div>
      }
    </section>

    <!-- Edit/Create Product Modal -->
    <dialog id="product-form-modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box max-w-3xl">
        <form method="dialog">
          <button type="submit" aria-label="Close dialog" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
        </form>
        <h3 class="font-bold text-lg mb-4">
          {{ isEditing ? 'Edit Product' : 'Create New Product' }}
        </h3>

        <form (ngSubmit)="saveProduct()" #productForm="ngForm" class="space-y-4">
          <!-- Top Section: Image on Right, Name/Code on Left -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Left: Product Name & Code Number -->
            <div class="md:col-span-2 space-y-4">
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Product Name <span class="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="selectedProduct.name"
                  name="name"
                  required
                  placeholder="e.g. Laptop Dell XPS 15"
                  class="input input-bordered w-full"
                />
              </div>

              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Code Number</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="selectedProduct.codeNumber"
                  name="codeNumber"
                  placeholder="e.g. PROD-001"
                  class="input input-bordered w-full"
                />
              </div>
            </div>

            <!-- Right: Image Upload Area -->
            <div class="flex flex-col items-center gap-3">
              <div class="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-dashed border-base-300 bg-base-200 hover:border-primary transition-colors cursor-pointer"
                   (click)="triggerImageUpload()">
                @if (imagePreview) {
                  <img [src]="imagePreview" alt="Product preview" class="w-full h-full object-cover" />
                  <!-- Overlay actions -->
                  <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-circle btn-primary"
                      (click)="$event.stopPropagation(); triggerImageUpload()"
                      title="Change image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-circle btn-error"
                      (click)="$event.stopPropagation(); removeImage()"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                } @else {
                  <div class="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-sm font-medium">Click to upload</span>
                    <span class="text-xs mt-1">Image</span>
                  </div>
                }
                
                <!-- Loading overlay -->
                @if (imageLoading) {
                  <div class="absolute inset-0 bg-base-300/80 flex items-center justify-center">
                    <span class="loading loading-spinner loading-lg"></span>
                  </div>
                }
              </div>
              
              <!-- Upload button below image -->
              <label class="btn btn-sm btn-outline gap-2 cursor-pointer w-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {{ imagePreview ? 'Change' : 'Upload' }}
                <input
                  id="product-image-input"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  (change)="onImageSelected($event)"
                />
              </label>
            </div>
          </div>

          <!-- Divider -->
          <div class="divider my-2"></div>

          <!-- Rest of Form Fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-semibold">Category</span>
              </label>
              <select
                [(ngModel)]="selectedProduct.categoryId"
                name="categoryId"
                class="select select-bordered w-full"
                (ngModelChange)="onCategoryChange($event)"
              >
                <option [ngValue]="null">Select category...</option>
                @for (cat of categories; track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-semibold">Brand</span>
              </label>
              <input
                type="text"
                [(ngModel)]="selectedProduct.brandName"
                name="brandName"
                placeholder="e.g. Dell"
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-semibold">Price <span class="text-error">*</span></span>
            </label>
            <input
              type="number"
              [(ngModel)]="selectedProduct.price"
              name="price"
              required
              placeholder="e.g. 1200.00"
              class="input input-bordered w-full"
              step="0.01"
              min="0"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-semibold">Quality</span>
              </label>
              <select
                [(ngModel)]="selectedProduct.quality"
                name="quality"
                class="select select-bordered w-full"
              >
                <option value="">Select quality...</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-semibold">Voucher Number</span>
              </label>
              <input
                type="text"
                [(ngModel)]="selectedProduct.voucherNumber"
                name="voucherNumber"
                placeholder="e.g. VCH-2024-001"
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-semibold">Description</span>
            </label>
            <textarea
              [(ngModel)]="selectedProduct.description"
              name="description"
              placeholder="Product description..."
              class="textarea textarea-bordered w-full"
              rows="3"
            ></textarea>
          </div>

          <div class="modal-action">
            <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="!productForm.form.valid || !selectedProduct.name || selectedProduct.price === null || selectedProduct.price === undefined || imageLoading"
            >
              @if (imageLoading) {
                <span class="loading loading-spinner loading-sm"></span>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              }
              {{ isEditing ? 'Save Changes' : 'Create Product' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="Close dialog">close</button>
      </form>
    </dialog>

    <!-- View Product Modal -->
    <dialog id="product-view-modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box max-w-3xl">
        <form method="dialog">
          <button type="submit" aria-label="Close dialog" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10">✕</button>
        </form>
        @if (viewProduct) {
          <div class="space-y-6">
            <!-- Header -->
            <div class="flex items-start gap-6">
              @if (viewProduct.imageUrl) {
                <div class="w-32 h-32 rounded-xl overflow-hidden border-2 border-base-300 flex-shrink-0">
                  <img [src]="viewProduct.imageUrl" [alt]="viewProduct.name" class="w-full h-full object-cover" />
                </div>
              } @else {
                <div class="w-32 h-32 rounded-xl bg-base-200 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              }
              <div class="flex-1">
                <h3 class="font-bold text-2xl mb-2">{{ viewProduct.name }}</h3>
                <div class="flex flex-wrap gap-2">
                  @if (viewProduct.categoryName) {
                    <span class="badge badge-primary badge-outline">{{ viewProduct.categoryName }}</span>
                  }
                  @if (viewProduct.brandName) {
                    <span class="badge badge-secondary badge-outline">{{ viewProduct.brandName }}</span>
                  }
                  @if (viewProduct.quality) {
                    <span class="badge" [class.badge-success]="viewProduct.quality === 'Excellent'" [class.badge-warning]="viewProduct.quality === 'Good'" [class.badge-info]="viewProduct.quality === 'Fair'" [class.badge-error]="viewProduct.quality === 'Poor'">{{ viewProduct.quality }}</span>
                  }
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="divider my-2"></div>

            <!-- Product Details Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Code Number -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Code Number</p>
                <p class="text-base font-medium">{{ viewProduct.codeNumber || '-' }}</p>
              </div>

              <!-- Price -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Price</p>
                <p class="text-base font-medium text-primary">{{ viewProduct.price ? '$' + (viewProduct.price | number:'1.2-2') : '-' }}</p>
              </div>

              <!-- Voucher Number -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Voucher Number</p>
                <p class="text-base font-medium">{{ viewProduct.voucherNumber || '-' }}</p>
              </div>

              <!-- Created Date -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Created Date</p>
                <p class="text-base font-medium">{{ viewProduct.createdDate ? (viewProduct.createdDate | date:'shortDate') : '-' }}</p>
              </div>
            </div>

            <!-- Description -->
            @if (viewProduct.description) {
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">Description</p>
                <p class="text-base whitespace-pre-wrap">{{ viewProduct.description }}</p>
              </div>
            }
          </div>

          <!-- Action Buttons -->
          <div class="modal-action">
            <form method="dialog">
              <button type="submit" class="btn btn-ghost">Close</button>
            </form>
            <button type="button" class="btn btn-warning gap-2" (click)="closeViewAndEdit()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Product
            </button>
          </div>
        }
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="Close dialog">close</button>
      </form>
    </dialog>

    <!-- Delete Confirmation Modal -->
    <dialog id="product-delete-confirm-modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box">
        <form method="dialog">
          <button type="submit" aria-label="Close dialog" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        @if (productToDelete) {
          <div class="flex flex-col items-center text-center">
            <div class="mb-4">
              <div class="rounded-full p-4 bg-error/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>

            <h3 class="font-bold text-lg mb-2 text-error">Confirm Product Deletion</h3>

            <p class="text-base-content/70 mb-4">
              Are you sure you want to <strong class="text-error">delete</strong> the product
              <span class="font-bold">{{ productToDelete.name }}</span>?
            </p>

            <div class="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span class="text-sm">This action cannot be undone!</span>
            </div>

            <div class="flex w-full gap-3">
              <button class="btn btn-ghost flex-1" type="button" (click)="closeDeleteModal()">
                Cancel
              </button>
              <button
                class="btn btn-error flex-1 text-white"
                type="button"
                (click)="executeDelete()"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Product
              </button>
            </div>
          </div>
        }
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="Close dialog">close</button>
      </form>
    </dialog>

    <!-- Success/Error/Warning Message Modal -->
    <dialog id="product-message-modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box">
        <form method="dialog">
          <button type="submit" aria-label="Close dialog" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <div class="flex flex-col items-center text-center">
          <div class="mb-4">
            <div class="rounded-full p-4" [class]="messageType === 'success' ? 'bg-success/10' : messageType === 'warning' ? 'bg-warning/10' : 'bg-error/10'">
              @if (messageType === 'success') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              @if (messageType === 'warning') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              @if (messageType === 'error') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            </div>
          </div>

          <h3 class="font-bold text-lg mb-2" [class]="messageType === 'success' ? 'text-success' : messageType === 'warning' ? 'text-warning' : 'text-error'">{{ messageTitle }}</h3>
          <p class="text-base-content/70 mb-4">{{ messageContent }}</p>

          <div class="flex w-full">
            <button class="btn btn-ghost flex-1" type="button" (click)="closeMessageModal()">OK</button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="Close dialog">close</button>
      </form>
    </dialog>
  `
})
export class ProductsComponent implements OnInit {
  private readonly api = inject(ProductApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected products: ProductDto[] = [];
  protected categories: CategoryDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected search = '';

  // Pagination states
  protected currentPage = 1;
  protected pageSize = 5;
  protected totalItems = 0;
  protected totalPages = 0;

  // Sorting states
  protected sortBy: string = '';
  protected isAscending = true;

  // Filtering states
  protected filterCategory = '';
  protected filterBrand = '';

  // Modal states
  protected isEditing = false;
  protected selectedProduct: ProductDto = this.getEmptyProduct();
  protected productToDelete: ProductDto | null = null;
  protected viewProduct: ProductDto | null = null;
  protected messageType: 'success' | 'error' | 'warning' = 'success';
  protected messageTitle = '';
  protected messageContent = '';

  // Image states
  protected selectedImage: File | null = null;
  protected imagePreview: string | ArrayBuffer | null = null;
  protected imageLoading = false;
  protected isUploading = false;
  protected imageUploadProgress = 0;
  protected selectedImageUrl: string | null = null;

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  protected loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';

    const query: QueryOptions = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    // Add sorting
    if (this.sortBy) {
      query.sortBy = this.sortBy;
      query.isAscending = this.isAscending;
    }

    // Add category filter
    if (this.filterCategory) {
      query.filterOn = 'category';
      query.filterQuery = this.filterCategory;
    }

    // Add search filter
    if (this.search && this.search.trim() !== '') {
      query.filterOn = query.filterOn || 'name';
      query.filterQuery = this.search.trim();
    }

    this.api.list(query).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (result) => {
        if (result) {
          this.products = result.items || [];
          this.totalItems = result.totalCount || 0;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load products. Please try again.';
        console.error('Error loading products:', err);
      }
    });
  }

  protected loadCategories(): void {
    this.categoryApi.list().subscribe({
      next: (result) => {
        if (result) {
          this.categories = result;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  protected getEmptyProduct(): ProductDto {
    return {
      id: null,
      name: '',
      codeNumber: null,
      description: null,
      categoryId: null,
      categoryName: null,
      brandId: null,
      brandName: null,
      price: null,
      imageUrl: null,
      quality: null,
      voucherNumber: null,
      createdDate: null,
      updateDate: null
    };
  }

  protected get startIndex(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  protected get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  protected get visiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    const totalPages = this.totalPages;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total pages fit comfortably
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible range
      let start = Math.max(2, this.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages - 1, start + maxVisible - 1);

      // Adjust if we're near the end
      if (end - start < maxVisible - 1) {
        start = Math.max(2, end - maxVisible + 1);
      }

      // Add ellipsis if there's a gap after page 1
      if (start > 2) {
        pages.push('...');
      }

      // Add visible page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if there's a gap before last page
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  }

  protected goToPage(page: number | string): void {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    if (pageNum >= 1 && pageNum <= this.totalPages && pageNum !== this.currentPage) {
      this.currentPage = pageNum;
      this.loadProducts();
    }
  }

  protected goToFirstPage(): void {
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      this.loadProducts();
    }
  }

  protected goToLastPage(): void {
    if (this.currentPage !== this.totalPages) {
      this.currentPage = this.totalPages;
      this.loadProducts();
    }
  }

  protected nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  protected previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  protected onPageSizeChange(value: number | string): void {
    this.pageSize = typeof value === 'string' ? parseInt(value, 10) : value;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.loadProducts();
  }

  protected sortTable(field: string): void {
    if (this.sortBy === field) {
      this.isAscending = !this.isAscending;
    } else {
      this.sortBy = field;
      this.isAscending = true;
    }
    this.currentPage = 1;
    this.loadProducts();
  }

  private filterTimeout: any;

  protected onFilterChange(): void {
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    this.filterTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadProducts();
    }, 300);
  }

  private searchTimeout: any;

  protected onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadProducts();
    }, 300);
  }

  protected openCreateModal(): void {
    this.isEditing = false;
    this.selectedProduct = this.getEmptyProduct();
    this.clearImageState();
    const modal = document.getElementById('product-form-modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  protected openViewModal(product: ProductDto): void {
    this.viewProduct = { ...product };
    const modal = document.getElementById('product-view-modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  protected closeViewModal(): void {
    this.viewProduct = null;
    const modal = document.getElementById('product-view-modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  protected closeViewAndEdit(): void {
    this.closeViewModal();
    if (this.viewProduct) {
      setTimeout(() => {
        this.openEditModal(this.viewProduct!);
      }, 300);
    }
  }

  protected openEditModal(product: ProductDto): void {
    this.isEditing = true;
    this.selectedProduct = { ...product };
    this.selectedImageUrl = product.imageUrl || null;
    this.imagePreview = product.imageUrl || null;
    this.selectedImage = null;
    const modal = document.getElementById('product-form-modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  protected closeModal(): void {
    const modal = document.getElementById('product-form-modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
    this.clearImageState();
  }

  protected saveProduct(): void {
    if (!this.selectedProduct.name || this.selectedProduct.price === null || this.selectedProduct.price === undefined) {
      this.showMessage('error', 'Validation Error', 'Product name and price are required.');
      return;
    }

    this.isUploading = true;
    this.imageLoading = true;

    const finalizeAndClose = (success: boolean, action: string, productName: string, errorMsg?: string) => {
      this.isUploading = false;
      this.imageLoading = false;
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.loadProducts();
        this.closeModal();
        if (success) {
          this.showMessage('success', `${action} Successful`, `${productName} has been ${action.toLowerCase()} successfully.`);
        } else if (errorMsg) {
          this.showMessage('error', `${action} Failed`, errorMsg);
        } else {
          this.showMessage('warning', `${action} Partially Successful`, `${productName} was ${action.toLowerCase()} but image upload failed. You can upload the image later.`);
        }
      });
    };

    if (this.isEditing && this.selectedProduct.id) {
      // Update existing product
      this.api.update(this.selectedProduct.id, this.selectedProduct).subscribe({
        next: (updated) => {
          // Upload image if selected
          if (this.selectedImage && updated?.id) {
            this.uploadProductImage(updated.id)
              .then(() => {
                finalizeAndClose(true, 'Update', this.selectedProduct.name);
              })
              .catch((err) => {
                console.error('Image upload failed:', err);
                finalizeAndClose(false, 'Update', this.selectedProduct.name);
              });
          } else {
            finalizeAndClose(true, 'Update', this.selectedProduct.name);
          }
        },
        error: (err) => {
          this.isUploading = false;
          this.imageLoading = false;
          setTimeout(() => {
            this.showMessage('error', 'Update Failed', 'Could not update the product. Please try again.');
          });
          console.error('Error updating product:', err);
        }
      });
    } else {
      // Create new product
      const createRequest: CreateProductRequest = {
        name: this.selectedProduct.name,
        codeNumber: this.selectedProduct.codeNumber,
        description: this.selectedProduct.description,
        categoryId: this.selectedProduct.categoryId,
        categoryName: this.selectedProduct.categoryName,
        brandId: this.selectedProduct.brandId,
        brandName: this.selectedProduct.brandName,
        price: this.selectedProduct.price,
        quality: this.selectedProduct.quality,
        voucherNumber: this.selectedProduct.voucherNumber
      };

      this.api.create(createRequest).subscribe({
        next: (created) => {
          // Upload image if selected
          if (this.selectedImage && created?.id) {
            this.uploadProductImage(created.id)
              .then(() => {
                finalizeAndClose(true, 'Create', this.selectedProduct.name);
              })
              .catch((err) => {
                console.error('Image upload failed:', err);
                finalizeAndClose(false, 'Create', this.selectedProduct.name);
              });
          } else {
            finalizeAndClose(true, 'Create', this.selectedProduct.name);
          }
        },
        error: (err) => {
          this.isUploading = false;
          this.imageLoading = false;
          setTimeout(() => {
            this.showMessage('error', 'Create Failed', 'Could not create the product. Please try again.');
          });
          console.error('Error creating product:', err);
        }
      });
    }
  }

  protected confirmDelete(product: ProductDto): void {
    this.productToDelete = product;
    const modal = document.getElementById('product-delete-confirm-modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  protected closeDeleteModal(): void {
    const modal = document.getElementById('product-delete-confirm-modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
    this.productToDelete = null;
  }

  protected executeDelete(): void {
    if (!this.productToDelete?.id) return;

    this.api.delete(this.productToDelete.id).subscribe({
      next: () => {
        this.loadProducts();
        this.closeDeleteModal();
        this.showMessage('success', 'Product Deleted', `${this.productToDelete!.name} has been deleted.`);
      },
      error: (err) => {
        this.showMessage('error', 'Delete Failed', 'Could not delete the product. Please try again.');
        console.error('Error deleting product:', err);
      }
    });
  }

  protected showMessage(type: 'success' | 'error' | 'warning', title: string, content: string): void {
    this.messageType = type;
    this.messageTitle = title;
    this.messageContent = content;
    const modal = document.getElementById('product-message-modal') as HTMLDialogElement;
    if (modal) {
      modal.showModal();
    }
  }

  protected closeMessageModal(): void {
    const modal = document.getElementById('product-message-modal') as HTMLDialogElement;
    if (modal) {
      modal.close();
    }
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedImage = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  protected triggerImageUpload(): void {
    const fileInput = document.querySelector('#product-form-modal input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  protected removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.selectedImageUrl = null;

    // Reset file input
    const fileInput = document.querySelector('#product-form-modal input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    // If editing, delete existing image from server
    if (this.isEditing && this.selectedProduct.id) {
      this.api.deleteImage(this.selectedProduct.id).subscribe({
        next: () => {
          this.selectedProduct.imageUrl = null;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error removing image:', err)
      });
    }
  }

  protected uploadProductImage(productId: string): Promise<void> {
    if (!this.selectedImage) return Promise.resolve();

    this.imageLoading = true;
    this.imageUploadProgress = 10;

    return new Promise((resolve, reject) => {
      const fileToUpload = this.selectedImage;
      if (!fileToUpload) {
        reject(new Error('No image selected'));
        return;
      }

      this.api.uploadImage(productId, fileToUpload).subscribe({
        next: (result) => {
          if (result?.imageUrl) {
            this.selectedProduct.imageUrl = result.imageUrl;
            this.selectedImageUrl = result.imageUrl;
            this.imagePreview = result.imageUrl;
          }
          this.imageLoading = false;
          this.isUploading = false;
          this.imageUploadProgress = 100;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.imageUploadProgress = 0;
            this.cdr.detectChanges();
          }, 1500);

          resolve();
        },
        error: (err) => {
          this.imageLoading = false;
          this.isUploading = false;
          this.imageUploadProgress = 0;
          this.cdr.detectChanges();
          console.error('Error uploading image:', err);
          reject(err);
        }
      });
    });
  }

  protected async deleteProductImage(productId: string): Promise<void> {
    this.api.deleteImage(productId).subscribe({
      next: () => {
        this.selectedProduct.imageUrl = null;
        this.selectedImageUrl = null;
        this.imagePreview = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error deleting product image:', err)
    });
  }

  protected onCategoryChange(categoryId: string | null): void {
    const selectedCategory = this.categories.find(c => c.id === categoryId);
    if (selectedCategory) {
      this.selectedProduct.categoryName = selectedCategory.name;
    }
  }

  private clearImageState(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.imageLoading = false;
    this.isUploading = false;
    this.imageUploadProgress = 0;
    this.selectedImageUrl = null;

    const fileInput = document.querySelector('#product-form-modal input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // ===== EXPORT METHODS =====

  protected exportToCSV(): void {
    if (this.products.length === 0) return;

    // CSV Headers
    const headers = ['Name', 'Code Number', 'Category', 'Brand', 'Price', 'Quality', 'Voucher Number', 'Description'];
    
    // CSV Rows
    const rows = this.products.map(p => [
      this.escapeCsvValue(p.name),
      this.escapeCsvValue(p.codeNumber),
      this.escapeCsvValue(p.categoryName),
      this.escapeCsvValue(p.brandName),
      p.price?.toFixed(2) || '',
      this.escapeCsvValue(p.quality),
      this.escapeCsvValue(p.voucherNumber),
      this.escapeCsvValue(p.description)
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_${this.getTimestamp()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private escapeCsvValue(value: string | null | undefined): string {
    if (!value) return '';
    // Escape quotes and wrap in quotes if contains comma
    const escaped = value.replace(/"/g, '""');
    return escaped.includes(',') ? `"${escaped}"` : escaped;
  }

  protected exportToPDF(): void {
    if (this.products.length === 0) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Products Report', 14, 22);
    
    // Subtitle with filters info
    doc.setFontSize(10);
    const filterInfo = this.getFilterInfo();
    if (filterInfo) {
      doc.text(filterInfo, 14, 30);
    }
    
    // Table
    const tableData = this.products.map(p => [
      p.name,
      p.codeNumber || '-',
      p.categoryName || '-',
      p.brandName || '-',
      p.price ? `$${p.price.toFixed(2)}` : '-',
      p.quality || '-',
      p.voucherNumber || '-'
    ]);

    autoTable(doc, {
      startY: filterInfo ? 35 : 30,
      head: [['Name', 'Code', 'Category', 'Brand', 'Price', 'Quality', 'Voucher #']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 40 },
        4: { cellWidth: 20, halign: 'right' }
      }
    });

    // Footer with total count
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(10);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Total Products: ${this.products.length}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Save
    doc.save(`products_${this.getTimestamp()}.pdf`);
  }

  protected printProducts(): void {
    if (this.products.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    const filterInfo = this.getFilterInfo();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Products Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; color: #1f2937; }
          .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 11px; }
          th { background-color: #3b82f6; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Products Report</h1>
        ${filterInfo ? `<p class="subtitle">${filterInfo}</p>` : ''}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code Number</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Quality</th>
              <th>Voucher #</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${this.products.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.codeNumber || '-'}</td>
                <td>${p.categoryName || '-'}</td>
                <td>${p.brandName || '-'}</td>
                <td>${p.price ? '$' + p.price.toFixed(2) : '-'}</td>
                <td>${p.quality || '-'}</td>
                <td>${p.voucherNumber || '-'}</td>
                <td>${p.description || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          Total Products: ${this.products.length} | Generated: ${new Date().toLocaleString()}
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  private getFilterInfo(): string {
    const filters: string[] = [];
    if (this.search) filters.push(`Search: ${this.search}`);
    if (this.filterCategory) filters.push(`Category: ${this.filterCategory}`);
    if (this.sortBy) {
      const sortDirection = this.isAscending ? 'Ascending' : 'Descending';
      filters.push(`Sort: ${this.sortBy} (${sortDirection})`);
    }
    return filters.length > 0 ? filters.join(' | ') : '';
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
}
