import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductApiService } from '../../core/services/product-api.service';
import { CategoryApiService } from '../../core/services/category-api.service';
import { ProductDto, CreateProductRequest, CategoryDto } from '../../models/inventory.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { finalize } from 'rxjs/operators';

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
            <span class="badge badge-ghost">{{ filteredProducts.length }} visible</span>
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
          <button type="button" class="btn btn-primary gap-2" (click)="openCreateModal()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      <div class="overflow-hidden rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg my-6">
        <div class="overflow-x-auto px-4">
          <table class="table table-zebra table-pin-rows">
            <thead>
              <tr>
                <th class="text-base font-bold">Name</th>
                <th class="text-base font-bold">Category</th>
                <th class="text-base font-bold">Brand</th>
                <th class="text-base font-bold">Price</th>
                <th class="text-center text-base font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of paginatedProducts; track item.id) {
                <tr>
                  <td class="font-medium">{{ item.name }}</td>
                  <td>{{ item.categoryName || '-' }}</td>
                  <td>{{ item.brandName || '-' }}</td>
                  <td>{{ item.price | number:'1.2-2' }}</td>
                  <td>
                    <div class="flex gap-2 justify-center">
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
          </table>
        </div>
      </div>

      <!-- Pagination - Outside the card -->
      <div class="mt-4">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 rounded-[24px] border border-base-300/70 bg-base-100/70 shadow-lg">
          <div class="text-sm text-base-content/60">
            Showing {{ startIndex }}-{{ endIndex }} of {{ filteredProducts.length }} products
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <span class="text-sm text-base-content/60">Rows per page:</span>
              <select
                [(ngModel)]="pageSize"
                (ngModelChange)="onPageSizeChange()"
                class="select select-bordered select-sm"
              >
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="20">20</option>
                <option [value]="50">50</option>
              </select>
            </div>
            @if (totalPages > 1) {
              <div class="join">
                <button
                  type="button"
                  class="join-item btn btn-sm"
                  (click)="goToFirstPage()"
                  [disabled]="currentPage === 1"
                >
                  «
                </button>
                <button
                  type="button"
                  class="join-item btn btn-sm"
                  (click)="previousPage()"
                  [disabled]="currentPage === 1"
                >
                  ‹
                </button>
                @for (page of visiblePages; track page) {
                  <button
                    type="button"
                    class="join-item btn btn-sm"
                    [class.btn-active]="page === currentPage"
                    (click)="goToPage(page)"
                  >
                    {{ page }}
                  </button>
                }
                <button
                  type="button"
                  class="join-item btn btn-sm"
                  (click)="nextPage()"
                  [disabled]="currentPage === totalPages"
                >
                  ›
                </button>
                <button
                  type="button"
                  class="join-item btn btn-sm"
                  (click)="goToLastPage()"
                  [disabled]="currentPage === totalPages"
                >
                  »
                </button>
              </div>
            }
          </div>
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

    <!-- Success/Error Message Modal -->
    <dialog id="product-message-modal" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box">
        <form method="dialog">
          <button type="submit" aria-label="Close dialog" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <div class="flex flex-col items-center text-center">
          <div class="mb-4">
            <div class="rounded-full p-4" [class]="messageType === 'success' ? 'bg-success/10' : 'bg-error/10'">
              @if (messageType === 'success') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              @if (messageType === 'error') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            </div>
          </div>

          <h3 class="font-bold text-lg mb-2" [class]="messageType === 'success' ? 'text-success' : 'text-error'">{{ messageTitle }}</h3>
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
  protected pageSize = 10;

  // Modal states
  protected isEditing = false;
  protected selectedProduct: ProductDto = this.getEmptyProduct();
  protected productToDelete: ProductDto | null = null;
  protected messageType: 'success' | 'error' = 'success';
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
    this.currentPage = 1; // Reset to first page
    this.api.list().pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (result) => {
        if (result?.items) {
          this.products = result.items;
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

  protected get filteredProducts(): ProductDto[] {
    if (!this.search || this.search.trim() === '') {
      return this.products;
    }
    const searchLower = this.search.toLowerCase();
    return this.products.filter(p =>
      p.name?.toLowerCase().includes(searchLower) ||
      p.categoryName?.toLowerCase().includes(searchLower) ||
      p.brandName?.toLowerCase().includes(searchLower) ||
      p.codeNumber?.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower)
    );
  }

  protected get totalItems(): number {
    return this.filteredProducts.length;
  }

  protected get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  protected get paginatedProducts(): ProductDto[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredProducts.slice(startIndex, endIndex);
  }

  protected get startIndex(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  protected get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  protected get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  protected goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  protected goToFirstPage(): void {
    this.currentPage = 1;
  }

  protected goToLastPage(): void {
    this.currentPage = this.totalPages;
  }

  protected nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  protected previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  protected onPageSizeChange(): void {
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  protected onSearchChange(): void {
    this.currentPage = 1; // Reset to first page when searching
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

  protected async saveProduct(): Promise<void> {
    if (!this.selectedProduct.name || this.selectedProduct.price === null || this.selectedProduct.price === undefined) {
      this.showMessage('error', 'Validation Error', 'Product name and price are required.');
      return;
    }

    this.isUploading = true;

    try {
      if (this.isEditing && this.selectedProduct.id) {
        // Update existing product
        this.api.update(this.selectedProduct.id, this.selectedProduct).subscribe({
          next: async (updated) => {
            // Upload image if selected
            if (this.selectedImage && updated?.id) {
              await this.uploadProductImage(updated.id);
            }
            // Wait a bit for backend to process, then reload
            setTimeout(() => {
              this.loadProducts();
              this.closeModal();
              this.showMessage('success', 'Product Updated', `${this.selectedProduct.name} has been updated successfully.`);
            }, 500);
          },
          error: (err) => {
            this.isUploading = false;
            this.showMessage('error', 'Update Failed', 'Could not update the product. Please try again.');
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
          brandId: this.selectedProduct.brandId,
          price: this.selectedProduct.price,
          quality: this.selectedProduct.quality,
          voucherNumber: this.selectedProduct.voucherNumber
        };

        this.api.create(createRequest).subscribe({
          next: async (created) => {
            // Upload image if selected
            if (this.selectedImage && created?.id) {
              await this.uploadProductImage(created.id);
            }
            // Wait a bit for backend to process, then reload
            setTimeout(() => {
              this.loadProducts();
              this.closeModal();
              this.showMessage('success', 'Product Created', `${this.selectedProduct.name} has been created successfully.`);
            }, 500);
          },
          error: (err) => {
            this.isUploading = false;
            this.showMessage('error', 'Create Failed', 'Could not create the product. Please try again.');
            console.error('Error creating product:', err);
          }
        });
      }
    } catch (error) {
      this.isUploading = false;
      this.showMessage('error', 'Error', 'An unexpected error occurred.');
      console.error('Error saving product:', error);
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

  protected showMessage(type: 'success' | 'error', title: string, content: string): void {
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

  protected async uploadProductImage(productId: string): Promise<void> {
    if (!this.selectedImage) return;

    this.imageLoading = true;
    this.imageUploadProgress = 10;

    try {
      this.api.uploadImage(productId, this.selectedImage).subscribe({
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
          }, 1500);
        },
        error: (err) => {
          this.imageLoading = false;
          this.isUploading = false;
          this.imageUploadProgress = 0;
          console.error('Error uploading image:', err);
        }
      });
    } catch (error) {
      this.imageLoading = false;
      this.isUploading = false;
      this.imageUploadProgress = 0;
      console.error('Error uploading image:', error);
    }
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
}
