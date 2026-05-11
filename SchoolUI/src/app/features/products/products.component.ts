import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ProductApiService } from '../../core/services/product-api.service';
import { CategoryApiService } from '../../core/services/category-api.service';
import { ProductDto, CreateProductRequest, CategoryDto, ProductPurchaseHistoryDto, BrandDto, DepartmentDto, PersonDto, SupplierDto } from '../../models/inventory.model';
import { QueryOptions } from '../../models/paging.model';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { PaginationComponent } from '../../core/interceptors/pagination.component';
import * as signalR from '@microsoft/signalr';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService, SharedModule } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';

export interface ExtendedProductDto extends ProductDto {
  qualityId?: string | null;
  responsiblePersonId?: string | null;
  attributes?: string | null;
  supplierContactList?: string[] | null;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective, PaginationComponent, TableModule, BadgeModule, ButtonModule, DialogModule, ProgressBarModule, TooltipModule, ToastModule, InputTextModule, SharedModule, PopoverModule],
  template: `
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="space-y-1">
          <div class="flex flex-row items-center gap-2 mb-1">
            <p-badge value="Resource Reporting" severity="info" styleClass="font-semibold tracking-wider text-xs"></p-badge>
          </div>
          <h2 class="text-3xl font-bold tracking-tight text-base-content">Inventory Report Builder</h2>
          <p class="max-w-2xl text-sm text-base-content/70">Filter, analyze, and generate comprehensive reports for your school's resources.</p>
        </div>

        <!-- Quick Summary Stats -->
        <div class="flex flex-row divide-x shadow-sm border border-base-300 bg-base-200/50 rounded-lg w-full md:w-auto">
          <div class="flex flex-col py-2 px-4">
            <div class="text-xs font-semibold text-base-content/70">Total Resources</div>
            <div class="text-lg font-bold text-primary">{{ totalItems }}</div>
          </div>
          <div class="flex flex-col py-2 px-4">
            <div class="text-xs font-semibold text-base-content/70">Categories</div>
            <div class="text-lg font-bold text-base-content">{{ uniqueCategories.length }}</div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <!-- Filters Grid -->
        <div class="flex flex-wrap gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
          <div class="min-w-[180px] flex-1 sm:min-w-[200px]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Search</label>
            <div class="relative">
              <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input [(ngModel)]="search" (ngModelChange)="onSearchChange()" placeholder="Search products..." class="w-full rounded-md border border-gray-300 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="min-w-[140px] flex-1 sm:min-w-[160px]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Category</label>
            <select [(ngModel)]="filterCategory" (ngModelChange)="onFilterChange()" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All</option>
              @for (cat of categories; track cat.id) { <option [value]="cat.name">{{ cat.name }}</option> }
            </select>
          </div>
          <div class="min-w-[140px] flex-1 sm:min-w-[160px]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Department</label>
            <select [(ngModel)]="filterDepartment" (ngModelChange)="onFilterChange()" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All</option>
              @for (dept of departments; track dept.id) { <option [value]="dept.name">{{ dept.name }}</option> }
            </select>
          </div>
          <div class="min-w-[120px] flex-1 sm:min-w-[140px]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Condition</label>
            <select [(ngModel)]="filterQuality" (ngModelChange)="onFilterChange()" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All</option>
              @for (q of qualities; track q.id) { <option [value]="q.name">{{ q.name }}</option> }
            </select>
          </div>
          <div class="min-w-[120px] flex-1 sm:min-w-[140px]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Acquisition</label>
            <select [(ngModel)]="filterPurchaseType" (ngModelChange)="onFilterChange()" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All</option>
              <option value="Purchased">Purchased</option>
              <option value="Donated">Donated</option>
            </select>
          </div>
          <div class="min-w-[120px] flex-1 sm:min-w-[140px]">
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Price</label>
            <select [(ngModel)]="filterPrice" (ngModelChange)="onFilterChange()" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">All</option>
              <option value="under100">Under $100</option>
              <option value="equal100">Exactly $100</option>
              <option value="over100">Over $100</option>
            </select>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
          <div class="flex items-center gap-2">
            @if (selectedProducts.size > 0) {
              <p-button label="Delete Selected ({{ selectedProducts.size }})" icon="pi pi-trash" severity="danger" (onClick)="confirmBulkDelete()"></p-button>
            }
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <p-button label="Columns" icon="pi pi-sliders-h" severity="secondary" [outlined]="true" (onClick)="columnPanel.toggle($event)"></p-button>
            <p-button label="Export" icon="pi pi-download" severity="secondary" [outlined]="true" (onClick)="exportPanel.toggle($event)"></p-button>
            <p-button label="Add Product" icon="pi pi-plus" (onClick)="openCreateModal()"></p-button>

            <p-popover #columnPanel>
              <div class="flex flex-col gap-1 w-52 max-h-[60vh] overflow-y-auto p-1">
                @for (col of availableColumns; track col.id) {
                  <label class="flex items-center gap-3 cursor-pointer p-2 hover:bg-base-200 rounded-md transition-colors">
                    <input type="checkbox" [checked]="visibleColumns.has(col.id)" (change)="toggleColumnVisibility(col.id, $event)" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                    <span class="text-sm font-medium text-base-content/80">{{ col.label }}</span>
                  </label>
                }
              </div>
            </p-popover>

            <p-popover #exportPanel>
              <div class="flex flex-col min-w-[150px] p-1">
                <button class="flex items-center gap-3 px-3 py-2 hover:bg-base-200 rounded-md transition-colors text-sm w-full text-left" (click)="exportToExcel(); exportPanel.hide()">
                  <i class="pi pi-file-excel text-green-600"></i> Excel
                </button>
                <button class="flex items-center gap-3 px-3 py-2 hover:bg-base-200 rounded-md transition-colors text-sm w-full text-left" (click)="exportToCSV(); exportPanel.hide()">
                  <i class="pi pi-file text-blue-600"></i> CSV
                </button>
                <button class="flex items-center gap-3 px-3 py-2 hover:bg-base-200 rounded-md transition-colors text-sm w-full text-left" (click)="exportToPDF(); exportPanel.hide()">
                  <i class="pi pi-file-pdf text-red-600"></i> PDF
                </button>
                <div class="border-t border-base-200 my-1"></div>
                <button class="flex items-center gap-3 px-3 py-2 hover:bg-base-200 rounded-md transition-colors text-sm w-full text-left" (click)="printProducts(); exportPanel.hide()">
                  <i class="pi pi-print text-gray-600"></i> Print
                </button>
              </div>
            </p-popover>
          </div>
        </div>

        <!-- Table -->
        <div class="my-6 rounded-lg border border-base-300 bg-base-100 overflow-hidden">
          <p-table [value]="products" dataKey="id" [loading]="loading" [scrollable]="true" [virtualScroll]="true" [virtualScrollItemSize]="46" scrollHeight="calc(100vh - 220px)" styleClass="p-datatable-striped p-datatable-sm [&_td]:!px-4 [&_td]:!py-3 [&_th]:!px-4 [&_th]:!py-3" [tableStyle]="{'min-width': '50rem'}">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 3rem">
                  <input type="checkbox" [checked]="isAllSelected" (change)="toggleSelectAll()" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                </th>
                @if (visibleColumns.has('name')) { <th class="cursor-pointer" (click)="sortTable('name')">Name <i *ngIf="sortBy === 'name'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('codeNumber')) { <th class="cursor-pointer" (click)="sortTable('codeNumber')">Code Number <i *ngIf="sortBy === 'codeNumber'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('year')) { <th class="cursor-pointer" (click)="sortTable('year')">Year <i *ngIf="sortBy === 'year'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('plateNumber')) { <th class="cursor-pointer" (click)="sortTable('plateNumber')">Plate Number <i *ngIf="sortBy === 'plateNumber'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('engineNumber')) { <th class="cursor-pointer" (click)="sortTable('engineNumber')">Engine/Serial # <i *ngIf="sortBy === 'engineNumber'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('category')) { <th class="cursor-pointer" (click)="sortTable('category')">Category <i *ngIf="sortBy === 'category'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('brand')) { <th class="cursor-pointer" (click)="sortTable('brand')">Brand <i *ngIf="sortBy === 'brand'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('department')) { <th class="cursor-pointer" (click)="sortTable('department')">Department <i *ngIf="sortBy === 'department'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('quality')) { <th class="cursor-pointer" (click)="sortTable('quality')">Condition <i *ngIf="sortBy === 'quality'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('responsiblePerson')) { <th class="cursor-pointer" (click)="sortTable('responsiblePerson')">Responsible Person <i *ngIf="sortBy === 'responsiblePerson'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('initialQuantity')) { <th class="cursor-pointer" (click)="sortTable('initialQuantity')">Qty <i *ngIf="sortBy === 'initialQuantity'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('voucherNumber')) { <th class="cursor-pointer" (click)="sortTable('voucherNumber')">Voucher # <i *ngIf="sortBy === 'voucherNumber'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('donorName')) { <th class="cursor-pointer" (click)="sortTable('donorName')">Donor <i *ngIf="sortBy === 'donorName'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('supplier')) { <th class="cursor-pointer" (click)="sortTable('supplierName')">Supplier <i *ngIf="sortBy === 'supplierName'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('purchaseType')) { <th class="cursor-pointer" (click)="sortTable('purchaseType')">Acquisition Type <i *ngIf="sortBy === 'purchaseType'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('price')) { <th class="cursor-pointer" (click)="sortTable('price')">Price <i *ngIf="sortBy === 'price'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                @if (visibleColumns.has('description')) { <th class="cursor-pointer" (click)="sortTable('description')">Description <i *ngIf="sortBy === 'description'" class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i></th> }
                <th class="text-center">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-product>
              <tr>
                <td>
                  <input type="checkbox" [checked]="selectedProducts.has(product.id!)" (change)="toggleSelection(product.id!)" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                </td>
                @if (visibleColumns.has('name')) { <td class="font-medium">{{ product.name }}</td> }
                @if (visibleColumns.has('codeNumber')) { <td>{{ product.codeNumber || '-' }}</td> }
                @if (visibleColumns.has('year')) { <td>{{ product.year ? (product.year | slice:0:4) : '-' }}</td> }
                @if (visibleColumns.has('plateNumber')) { <td>{{ product.plateNumber || '-' }}</td> }
                @if (visibleColumns.has('engineNumber')) { <td>{{ product.engineNumber || '-' }}</td> }
                @if (visibleColumns.has('category')) { <td>{{ product.categoryName || getLookupName(categories, product.categoryId) || '-' }}</td> }
                @if (visibleColumns.has('brand')) { <td>{{ product.brandName || getLookupName(brands, product.brandId) || '-' }}</td> }
                @if (visibleColumns.has('department')) { <td>{{ product.departmentName || getLookupName(departments, product.departmentId) || '-' }}</td> }
                @if (visibleColumns.has('quality')) { <td><p-badge [value]="product.quality || getLookupName(qualities, product.qualityId) || '-'" severity="info"></p-badge></td> }
                @if (visibleColumns.has('responsiblePerson')) { <td>{{ product.responsiblePerson || getLookupName(persons, product.responsiblePersonId) || '-' }}</td> }
                @if (visibleColumns.has('initialQuantity')) { <td class="text-right">{{ product.initialQuantity || '-' }}</td> }
                @if (visibleColumns.has('voucherNumber')) { <td>{{ product.voucherNumber || '-' }}</td> }
                @if (visibleColumns.has('donorName')) { <td>{{ product.donorName || '-' }}</td> }
                @if (visibleColumns.has('supplier')) {
                  <td>
                    <div class="flex flex-col">
                      <span>{{ product.supplierName || '-' }}</span>
                      @if (product.supplierContact) {
                        <span class="text-xs text-base-content/60">{{ product.supplierContact }}</span>
                      }
                    </div>
                  </td>
                }
                @if (visibleColumns.has('purchaseType')) { <td>{{ product.purchaseType || '-' }}</td> }
                @if (visibleColumns.has('price')) { <td>{{ product.price ? '$' + (product.price | number:'1.2-2') : '-' }}</td> }
                @if (visibleColumns.has('description')) { <td class="whitespace-normal max-w-[200px] truncate" [pTooltip]="product.description || ''" tooltipPosition="top">{{ product.description || '-' }}</td> }
                <td class="text-center whitespace-nowrap">
                  <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="openViewModal(product)" pTooltip="View"></p-button>
                  <p-button icon="pi pi-arrow-right-arrow-left" [rounded]="true" [text]="true" severity="success" (onClick)="openTransferModal(product)" pTooltip="Transfer"></p-button>
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="openEditModal(product)" pTooltip="Edit"></p-button>
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmDelete(product)" pTooltip="Delete"></p-button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td [attr.colspan]="visibleColumnCount" class="py-10 text-center text-gray-500">No products match your search.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <app-pagination [totalItems]="totalItems" [pageSize]="pageSize" [currentPage]="currentPage" (pageChange)="goToPage($event)" (pageSizeChange)="onPageSizeChange($event)"></app-pagination>
      </div>
    </section>

    <!-- Create/Edit Modal -->
    <p-dialog [header]="isEditing ? 'Edit Product' : 'Create New Product'" [(visible)]="isFormModalVisible" [modal]="true" [dismissableMask]="true" [style]="{width: '100%', maxWidth: '800px'}">
      <form id="product-form-modal" (ngSubmit)="saveProduct()" #productForm="ngForm" class="space-y-4 pt-2">
        <!-- Top Section: Image on Right, Name/Code on Left -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Left: Product Name & Code Number -->
          <div class="md:col-span-2 space-y-4">
            <div class="flex flex-col w-full">
              <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Product Name <span class="text-red-500">*</span></span></label>
              <input pInputText type="text" [(ngModel)]="selectedProduct.name" name="name" required placeholder="e.g. Laptop Dell XPS 15" class="w-full" />
            </div>
            <div class="flex flex-col w-full mt-4">
              <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Code Number</span></label>
              <input pInputText type="text" [(ngModel)]="selectedProduct.codeNumber" name="codeNumber" placeholder="e.g. PROD-001" class="w-full" />
            </div>
          </div>

          <!-- Right: Image Upload Area -->
          <div class="flex flex-col items-center gap-3">
            <div class="relative w-full max-w-[160px] mx-auto aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-500 transition-colors cursor-pointer flex items-center justify-center" (click)="triggerImageUpload()">
              @if (imagePreview) {
                <img [src]="imagePreview" alt="Product preview" loading="lazy" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <p-button icon="pi pi-camera" [rounded]="true" severity="info" (onClick)="$event.stopPropagation(); triggerImageUpload()" pTooltip="Change Image"></p-button>
                  <p-button icon="pi pi-trash" [rounded]="true" severity="danger" (onClick)="$event.stopPropagation(); removeImage()" pTooltip="Remove Image"></p-button>
                </div>
              } @else {
                <div class="flex flex-col items-center text-gray-400">
                  <i class="pi pi-image text-3xl mb-2"></i>
                  <span class="text-sm font-medium">Upload Image</span>
                </div>
              }
              @if (imageLoading) {
                <div class="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <i class="pi pi-spin pi-spinner text-2xl text-blue-600"></i>
                </div>
              }
            </div>
            <input type="file" class="hidden" accept="image/*" (change)="onImageSelected($event)" />
          </div>
        </div>

        <div class="border-t border-gray-200 my-4"></div>

        <!-- Classification Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col w-full">
            <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Category</span></label>
            <div class="relative">
              <input pInputText [ngModel]="selectedProduct.categoryName" (ngModelChange)="onAutocompleteInput('category', $event)" name="categoryName" class="w-full pr-8" placeholder="Select or type..." (focus)="filterSuggestions('category', selectedProduct.categoryName || '')" (blur)="hideSuggestionsDelayed('category')" (keydown.enter)="onAutocompleteEnter('category', $event)" autocomplete="off" />
              <i *ngIf="selectedProduct.categoryName" class="pi pi-times absolute right-3 top-[10px] text-gray-400 hover:text-gray-700 cursor-pointer" (mousedown)="$event.preventDefault(); onAutocompleteInput('category', '')"></i>
              @if (showSuggestions['category'] && (filteredSuggestions['category']?.length ?? 0) > 0) {
                <ul class="absolute z-50 w-full bg-white shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto border border-gray-200" (mousedown)="cancelHideSuggestions()">
                  @for (s of filteredSuggestions['category']; track s.name) {
                    <li (mousedown)="selectSuggestion('category', s)" class="p-2 hover:bg-gray-50 cursor-pointer text-sm">{{ s.name }} @if (s.isNew) { <span class="text-xs text-green-600 ml-1">(Add new)</span> }</li>
                  }
                </ul>
              }
            </div>
          </div>

          <div class="flex flex-col w-full">
            <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Brand</span></label>
            <div class="relative">
              <input pInputText [ngModel]="selectedProduct.brandName" (ngModelChange)="onAutocompleteInput('brand', $event)" name="brandName" class="w-full pr-8" placeholder="Select or type..." (focus)="filterSuggestions('brand', selectedProduct.brandName || '')" (blur)="hideSuggestionsDelayed('brand')" (keydown.enter)="onAutocompleteEnter('brand', $event)" autocomplete="off" />
              <i *ngIf="selectedProduct.brandName" class="pi pi-times absolute right-3 top-[10px] text-gray-400 hover:text-gray-700 cursor-pointer" (mousedown)="$event.preventDefault(); onAutocompleteInput('brand', '')"></i>
              @if (showSuggestions['brand'] && (filteredSuggestions['brand']?.length ?? 0) > 0) {
                <ul class="absolute z-50 w-full bg-white shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto border border-gray-200" (mousedown)="cancelHideSuggestions()">
                  @for (s of filteredSuggestions['brand']; track s.name) {
                    <li (mousedown)="selectSuggestion('brand', s)" class="p-2 hover:bg-gray-50 cursor-pointer text-sm">{{ s.name }} @if (s.isNew) { <span class="text-xs text-green-600 ml-1">(Add new)</span> }</li>
                  }
                </ul>
              }
            </div>
          </div>

          <div class="flex flex-col w-full">
            <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Department</span></label>
            <div class="relative">
              <input pInputText [ngModel]="selectedProduct.departmentName" (ngModelChange)="onAutocompleteInput('department', $event)" name="departmentName" class="w-full pr-8" placeholder="Select or type..." (focus)="filterSuggestions('department', selectedProduct.departmentName || '')" (blur)="hideSuggestionsDelayed('department')" (keydown.enter)="onAutocompleteEnter('department', $event)" autocomplete="off" />
              <i *ngIf="selectedProduct.departmentName" class="pi pi-times absolute right-3 top-[10px] text-gray-400 hover:text-gray-700 cursor-pointer" (mousedown)="$event.preventDefault(); onAutocompleteInput('department', '')"></i>
              @if (showSuggestions['department'] && (filteredSuggestions['department']?.length ?? 0) > 0) {
                <ul class="absolute z-50 w-full bg-white shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto border border-gray-200" (mousedown)="cancelHideSuggestions()">
                  @for (s of filteredSuggestions['department']; track s.name) {
                    <li (mousedown)="selectSuggestion('department', s)" class="p-2 hover:bg-gray-50 cursor-pointer text-sm">{{ s.name }} @if (s.isNew) { <span class="text-xs text-green-600 ml-1">(Add new)</span> }</li>
                  }
                </ul>
              }
            </div>
          </div>

          <div class="flex flex-col w-full">
            <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Quality/Condition</span></label>
            <select [(ngModel)]="selectedProduct.qualityId" (ngModelChange)="onQualityChange($event)" name="quality" class="p-inputtext p-component w-full py-2 appearance-none">
              <option [ngValue]="null">Select condition...</option>
              @for (q of qualities; track q.id) {
                <option [value]="q.id">{{ q.name }}</option>
              }
            </select>
          </div>

          <div class="flex flex-col w-full">
            <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Price <span class="text-red-500">*</span></span></label>
            <input pInputText type="number" [(ngModel)]="selectedProduct.price" name="price" required class="w-full" step="0.01" min="0" placeholder="0.00" />
          </div>
        </div>

        <!-- Vehicle Specific Fields (Only shows if Motorbike or Car) -->
        @if (isVehicleCategory) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200 mt-4">
            <div class="flex flex-col w-full">
              <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Year</span></label>
              <input pInputText type="date" [ngModel]="selectedProduct.year | date:'yyyy-MM-dd'" (ngModelChange)="onYearChange($event)" name="year" class="w-full bg-white" [max]="todayString" />
            </div>
            <div class="flex flex-col w-full">
              <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Plate Number</span></label>
              <input pInputText type="text" [(ngModel)]="selectedProduct.plateNumber" name="plateNumber" class="w-full bg-white" placeholder="e.g. 1A-1234" />
            </div>
            <div class="flex flex-col w-full">
              <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Engine/Serial #</span></label>
              <input pInputText type="text" [(ngModel)]="selectedProduct.engineNumber" name="engineNumber" class="w-full bg-white" />
            </div>
          </div>
        }

        <div class="flex flex-col w-full mt-4">
          <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Description & Attributes</span></label>
          <textarea pInputText [(ngModel)]="selectedProduct.description" name="description" rows="3" class="w-full" placeholder="Product details, specs, etc."></textarea>
        </div>

        <!-- Stock Acquisition -->
        <div class="flex items-center text-sm font-semibold text-gray-400 my-4 before:flex-1 before:border-t before:border-gray-200 before:mr-4 after:flex-1 after:border-t after:border-gray-200 after:ml-4">{{ isEditing ? 'Purchase Information' : 'Initial Stock / Acquisition' }}</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/30 p-4 rounded-xl border border-gray-200">
            <div class="flex flex-col w-full" [class.opacity-70]="disablePurchaseFields">
              <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Acquisition Type</span></label>
              <select [(ngModel)]="selectedProduct.purchaseType" name="purchaseType" class="p-inputtext p-component w-full py-2 appearance-none" [disabled]="disablePurchaseFields">
                <option [ngValue]="null">None (Just setup product catalog)</option>
                <option value="Purchased">Purchased</option>
                <option value="Donated">Donated</option>
              </select>
            </div>

            @if (selectedProduct.purchaseType && selectedProduct.purchaseType !== 'None') {
              <div class="flex flex-col w-full" [class.opacity-70]="disablePurchaseFields">
                <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Initial Quantity <span class="text-red-500">*</span></span></label>
                <input pInputText type="number" [(ngModel)]="selectedProduct.initialQuantity" name="initialQuantity" min="1" required class="w-full bg-white" [disabled]="disablePurchaseFields" />
              </div>
              <div class="flex flex-col w-full">
                <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Responsible Person</span></label>
                <div class="relative">
                  <input pInputText [ngModel]="selectedProduct.responsiblePerson" (ngModelChange)="onAutocompleteInput('person', $event)" name="responsiblePerson" class="w-full bg-white pr-8" placeholder="Select or type..." (focus)="filterSuggestions('person', selectedProduct.responsiblePerson || '')" (blur)="hideSuggestionsDelayed('person')" (keydown.enter)="onAutocompleteEnter('person', $event)" autocomplete="off" />
                  <i *ngIf="selectedProduct.responsiblePerson" class="pi pi-times absolute right-3 top-[10px] text-gray-400 hover:text-gray-700 cursor-pointer" (mousedown)="$event.preventDefault(); onAutocompleteInput('person', '')"></i>
                  @if (showSuggestions['person'] && (filteredSuggestions['person']?.length ?? 0) > 0) {
                    <ul class="absolute z-50 w-full bg-white shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto border border-gray-200" (mousedown)="cancelHideSuggestions()">
                      @for (s of filteredSuggestions['person']; track s.fullName) {
                        <li (mousedown)="selectSuggestion('person', s)" class="p-2 hover:bg-gray-50 cursor-pointer text-sm">{{ s.fullName }} @if (s.isNew) { <span class="text-xs text-green-600 ml-1">(Add new)</span> }</li>
                      }
                    </ul>
                  }
                </div>
              </div>
            }
            
            @if (selectedProduct.purchaseType === 'Purchased') {
              <div class="flex flex-col w-full" [class.opacity-70]="disablePurchaseFields">
                <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Supplier Name</span></label>
                <div class="relative">
                  <input pInputText [ngModel]="selectedProduct.supplierName" (ngModelChange)="onAutocompleteInput('supplier', $event)" name="supplierName" class="w-full bg-white pr-8" placeholder="e.g. ABC Tech" (focus)="filterSuggestions('supplier', selectedProduct.supplierName || '')" (blur)="hideSuggestionsDelayed('supplier')" (keydown.enter)="onAutocompleteEnter('supplier', $event)" autocomplete="off" [disabled]="disablePurchaseFields" />
                  <i *ngIf="selectedProduct.supplierName" class="pi pi-times absolute right-3 top-[10px] text-gray-400 hover:text-gray-700 cursor-pointer" (mousedown)="$event.preventDefault(); onAutocompleteInput('supplier', '')" [class.pointer-events-none]="disablePurchaseFields"></i>
                  @if (showSuggestions['supplier'] && (filteredSuggestions['supplier']?.length ?? 0) > 0) {
                    <ul class="absolute z-50 w-full bg-white shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto border border-gray-200" (mousedown)="cancelHideSuggestions()">
                      @for (s of filteredSuggestions['supplier']; track s.name) {
                        <li (mousedown)="selectSuggestion('supplier', s)" class="p-2 hover:bg-gray-50 cursor-pointer text-sm">{{ s.name }} @if (s.isNew) { <span class="text-xs text-green-600 ml-1">(Add new)</span> }</li>
                      }
                    </ul>
                  }
                </div>
              </div>
              <div class="flex flex-col w-full">
                <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Voucher Number</span></label>
                <input pInputText [(ngModel)]="selectedProduct.voucherNumber" name="voucherNumber" class="w-full bg-white" placeholder="e.g. INV-12345" />
              </div>
              
              <div class="col-span-1 sm:col-span-2 mt-2">
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-700 text-sm">Contact Info</span>
                    <p-button size="small" label="+ Add Contact" severity="secondary" [outlined]="true" (onClick)="addContact()" [disabled]="disablePurchaseFields"></p-button>
                  </div>
                  @for (contact of contacts; track $index; let i = $index) {
                    <div class="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                      <select [ngModel]="getContactSelectValue(contact.type)" (ngModelChange)="onContactTypeChange(contact, $event)" [name]="'contactTypeSelect_' + i" class="p-inputtext p-component w-full sm:w-32 py-2 appearance-none bg-white" [disabled]="disablePurchaseFields">
                        <option value="Phone">Phone</option>
                        <option value="Email">Email</option>
                        <option value="Other">Other...</option>
                      </select>
                      @if (!isPredefinedContactType(contact.type) && getContactSelectValue(contact.type) === 'Other') {
                        <input pInputText [(ngModel)]="contact.type" (ngModelChange)="updateSupplierContact()" [name]="'customContactType_' + i" placeholder="Custom Label" class="w-full sm:w-40 bg-white" [disabled]="disablePurchaseFields" />
                      }
                      <input pInputText [(ngModel)]="contact.value" (ngModelChange)="updateSupplierContact()" [name]="'contactValue_' + i" [placeholder]="contact.type === 'Email' ? 'e.g. mail@example.com' : 'e.g. 012 345 678'" class="w-full flex-1 bg-white" [disabled]="disablePurchaseFields" />
                      @if (contacts.length > 1) {
                        <p-button icon="pi pi-times" severity="danger" [text]="true" [rounded]="true" (onClick)="removeContact(i)" [disabled]="disablePurchaseFields"></p-button>
                      }
                    </div>
                  }
                </div>
              </div>
            }
            
            @if (selectedProduct.purchaseType === 'Donated') {
              <div class="flex flex-col w-full" [class.opacity-70]="disablePurchaseFields">
                <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Donor Name</span></label>
                <input pInputText [(ngModel)]="selectedProduct.donorName" name="donorName" class="w-full bg-white" [disabled]="disablePurchaseFields" placeholder="e.g. John Doe" />
              </div>
            }
        </div>

        <div class="flex justify-end gap-2 mt-6 border-t border-gray-200 pt-4 w-full">
          <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="closeModal()"></p-button>
          <p-button [label]="isEditing ? 'Save Changes' : 'Create Product'" icon="pi pi-check" type="submit" [disabled]="!isProductFormValid || isUploading || imageLoading" [loading]="isUploading || imageLoading"></p-button>
        </div>
      </form>
    </p-dialog>

    <p-dialog header="Product Details" [(visible)]="isViewModalVisible" [modal]="true" [dismissableMask]="true" [style]="{width: '100%', maxWidth: '800px'}">
        @if (viewProduct) {
          <div class="space-y-6 pt-2">
            <!-- Header -->
            <div class="flex items-start gap-6">
              @if (viewProduct.imageUrl) {
                <div class="w-32 h-32 rounded-xl overflow-hidden border-2 border-base-300 flex-shrink-0">
                  <img [src]="viewProduct.imageUrl" [alt]="viewProduct.name" loading="lazy" class="w-full h-full object-cover" />
                </div>
              } @else {
                <div class="w-32 h-32 rounded-xl bg-base-200 flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-image text-5xl text-base-content/30"></i>
                </div>
              }
              <div class="flex-1">
                <h3 class="font-bold text-3xl mb-2">{{ viewProduct.name }}</h3>
                <div class="flex flex-wrap gap-2">
                  @if (viewProduct.categoryName) {
                    <p-badge [value]="viewProduct.categoryName" severity="success"></p-badge>
                  }
                  @if (viewProduct.brandName) {
                    <p-badge [value]="viewProduct.brandName" severity="secondary"></p-badge>
                  }
                  @if (viewProduct.quality || viewProduct.qualityId) {
                    <p-badge [value]="viewProduct.quality || getLookupName(qualities, viewProduct.qualityId) || ''" severity="info"></p-badge>
                  }
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-base-300 my-4"></div>

            <!-- Product Details Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Item Name -->
              <div class="bg-base-200/50 rounded-lg p-4">
                  <p class="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-1">Item Name</p>
                <p class="text-lg font-medium">{{ viewProduct.name || '-' }}</p>
              </div>

              <!-- Code Number -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-1">Code Number</p>
                <p class="text-lg font-medium">{{ viewProduct.codeNumber || '-' }}</p>
              </div>

              <!-- Brand -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-1">Brand</p>
                <p class="text-lg font-medium">{{ viewProduct.brandName || getLookupName(brands, viewProduct.brandId) || '-' }}</p>
              </div>

              <!-- Department -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-1">Department</p>
                <p class="text-lg font-medium">{{ viewProduct.departmentName || getLookupName(departments, viewProduct.departmentId) || '-' }}</p>
              </div>

              <!-- Price -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-1">Price</p>
                <p class="text-lg font-medium text-blue-600">{{ viewProduct.price ? '$' + (viewProduct.price | number:'1.2-2') : '-' }}</p>
              </div>

              <!-- Voucher Number -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-1">Voucher Number</p>
                <p class="text-lg font-medium">{{ viewProduct.voucherNumber || '-' }}</p>
              </div>

              <!-- Purchase Date -->
              <div class="bg-base-200/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-1">Purchase Date</p>
                <p class="text-lg font-medium">{{ viewProduct.invoiceDate ? (viewProduct.invoiceDate | date:'shortDate') : (viewProduct.createdDate ? (viewProduct.createdDate | date:'shortDate') : '-') }}</p>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 w-full mt-4 border-t border-base-300 pt-4">
            <p-button label="Close" severity="secondary" [text]="true" (onClick)="closeViewModal()"></p-button>
            <p-button label="Edit Product" icon="pi pi-pencil" severity="warn" (onClick)="closeViewAndEdit()"></p-button>
          </div>
        }
    </p-dialog>

    <!-- Stock Transfer Modal -->
    <p-dialog header="Transfer Stock" [(visible)]="isTransferModalVisible" [modal]="true" [dismissableMask]="true" [style]="{width: '100%', maxWidth: '500px'}">
        @if (productToTransfer) {
          <div class="space-y-4 pt-2">
                <div class="bg-base-300 p-3 rounded-lg text-sm">
              <p><strong>Product:</strong> {{ productToTransfer.name }}</p>
              <p><strong>Current Dept:</strong> {{ productToTransfer.departmentName || getLookupName(departments, productToTransfer.departmentId) || 'None' }}</p>
            </div>

                <div class="flex flex-col w-full">
                  <label class="py-2"><span class="font-semibold text-base-content text-sm">Target Department <span class="text-red-500">*</span></span></label>
                  <select [(ngModel)]="transferTargetDepartmentId" class="p-inputtext p-component w-full py-2">
                <option value="" disabled>Select destination department...</option>
                @for (dept of departments; track dept.id) {
                  @if (dept.id !== productToTransfer.departmentId) {
                    <option [value]="dept.id">{{ dept.name }}</option>
                  }
                }
              </select>
            </div>

                <div class="flex flex-col w-full">
                  <label class="py-2"><span class="font-semibold text-base-content text-sm">Quantity to Transfer <span class="text-red-500">*</span></span></label>
                  <input type="number" [(ngModel)]="transferQuantity" min="1" class="p-inputtext p-component w-full" />
            </div>

                <div class="flex flex-col w-full">
                  <label class="py-2"><span class="font-semibold text-base-content text-sm">Transfer Notes</span></label>
                  <textarea [(ngModel)]="transferNotes" class="p-inputtext p-component w-full" placeholder="Reason for transfer..."></textarea>
            </div>

            <div class="flex justify-end gap-2 w-full mt-4 border-t border-base-300 pt-4">
              <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="closeTransferModal()"></p-button>
              <p-button label="Confirm Transfer" icon="pi pi-check" severity="success" [disabled]="!transferTargetDepartmentId || transferQuantity < 1 || isTransferring" [loading]="isTransferring" (onClick)="executeTransfer()"></p-button>
            </div>
          </div>
        }
    </p-dialog>

    <!-- Toast Notifications -->
    <p-toast position="bottom-right"></p-toast>

    <!-- Import Errors Modal -->
    <p-dialog header="Import Completed with Errors" [visible]="importErrors.length > 0" (visibleChange)="importErrors = $event ? importErrors : []" [modal]="true" [dismissableMask]="true" [style]="{width: '100%', maxWidth: '500px'}">
        <p class="text-base-content/70 mb-4 pt-2">Some rows failed validation. Please review the specific errors below:</p>
        <div class="overflow-y-auto max-h-60 bg-base-200 rounded-lg p-3">
          <ul class="list-disc list-inside px-4">
            @for (err of importErrors; track $index) {
              <li class="text-error text-sm py-1">{{ err }}</li>
            }
          </ul>
        </div>
        <div class="flex justify-end w-full mt-4 border-t border-base-300 pt-4">
          <button type="button" class="btn btn-primary" (click)="importErrors = []">Dismiss</button>
        </div>
    </p-dialog>
  `
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly api = inject(ProductApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly baseUrl = `http://${window.location.hostname}:5001`;
  private readonly apiUrl = `${this.baseUrl}/api/inventory/products`;

  protected products: ExtendedProductDto[] = [];
  protected categories: CategoryDto[] = [];
  protected loading = false;
  protected errorMessage = '';
  protected search = '';
  protected years: number[] = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);

  // Lookups
  protected brands: BrandDto[] = [];
  protected departments: DepartmentDto[] = [];
  protected persons: PersonDto[] = [];
  protected suppliers: SupplierDto[] = [];
  protected qualities: any[] = [];
  protected lookupsLoading = false;

  protected get todayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Autocomplete state
  protected filteredSuggestions: { [key: string]: any[] } = {};
  protected showSuggestions: { [key: string]: boolean } = {};
  private suggestionTimeout: any;

  protected get uniqueCategories(): string[] {
    const map = new Map<string, string>();
    this.categories.forEach(c => c.name && map.set(c.name.toLowerCase().trim(), c.name));
    this.products.forEach(p => p.categoryName && map.set(p.categoryName.toLowerCase().trim(), p.categoryName));
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }

  protected get uniqueDepartments(): string[] {
    const map = new Map<string, string>();
    this.departments.forEach(d => d.name && map.set(d.name.toLowerCase().trim(), d.name));
    this.products.forEach(p => p.departmentName && map.set(p.departmentName.toLowerCase().trim(), p.departmentName));
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }

  protected get isVehicleCategory(): boolean {
    const catName = (
      this.selectedProduct?.categoryName || 
      this.categories.find(c => c.id === this.selectedProduct?.categoryId)?.name || 
      ''
    ).toLowerCase();
    return catName.includes('car') || catName.includes('motor') || catName.includes('moto') || catName.includes('bike') || catName.includes('vehicle');
  }

  protected get isProductFormValid(): boolean {
    if (!this.selectedProduct.name || this.selectedProduct.price === null || this.selectedProduct.price === undefined) return false;
    return true;
  }

  // Pagination states
  protected selectedProducts = new Set<string>();

  // Pagination states
  protected currentPage = 1;
  private readonly PAGE_SIZE_STORAGE_KEY = 'school_ui_products_page_size';
  protected pageSize = this.getInitialPageSize();
  protected totalItems = 0;
  protected totalPages = 0;

  private getInitialPageSize(): number {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.PAGE_SIZE_STORAGE_KEY);
      if (saved && !isNaN(parseInt(saved, 10))) {
        return parseInt(saved, 10);
      }
    }
      return 10; // Default page size
  }

  // Sorting states
  protected sortBy: string = 'createdDate';
  protected isAscending = false;

  // Filtering states
  protected filterCategory = '';
  protected filterDepartment = '';
  protected filterQuality = '';
  protected filterPurchaseType = '';
  protected filterPrice = '';

  private lookupCache = new Map<string, string>();

  // Column visibility
  protected availableColumns = [
    { id: 'name', label: 'Name' },
    { id: 'codeNumber', label: 'Code Number' },
    { id: 'year', label: 'Year' },
    { id: 'plateNumber', label: 'Plate Number' },
    { id: 'engineNumber', label: 'Engine/Serial #' },
    { id: 'category', label: 'Category' },
    { id: 'brand', label: 'Brand' },
    { id: 'department', label: 'Department' },
    { id: 'quality', label: 'Condition' },
    { id: 'responsiblePerson', label: 'Responsible Person' },
    { id: 'initialQuantity', label: 'Qty' },
    { id: 'voucherNumber', label: 'Voucher #' },
    { id: 'donorName', label: 'Donor' },
    { id: 'supplier', label: 'Supplier' },
    { id: 'purchaseType', label: 'Acquisition Type' },
    { id: 'price', label: 'Price' },
    { id: 'description', label: 'Description' }
  ];
  private readonly COLUMNS_STORAGE_KEY = 'school_ui_products_columns';
  protected visibleColumns = new Set<string>(this.getInitialVisibleColumns());

  private getInitialVisibleColumns(): string[] {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.COLUMNS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved columns', e);
        }
      }
    }
    return this.availableColumns.map(c => c.id);
  }

  protected getQualityRowClass(qualityName: string | null | undefined): string {
    if (!qualityName) return 'hover:bg-base-200';
    const q = qualityName.toLowerCase();
    if (q.includes('poor') || q.includes('broken') || q.includes('bad')) return 'bg-error/10 hover:bg-error/20';
    if (q.includes('fair') || q.includes('okay')) return 'bg-warning/10 hover:bg-warning/20';
    if (q.includes('excellent') || q.includes('new') || q.includes('great')) return 'bg-success/10 hover:bg-success/20';
    return 'hover:bg-base-200';
  }

  protected getLookupName(list: any[], id: string | null | undefined): string | null {
    if (!id || !list || list.length === 0) return null;
    if (this.lookupCache.has(id)) return this.lookupCache.get(id)!;

    const item = list.find(item => item.id === id);
    const name = item ? (item.name || item.fullName || null) : null;
    
    if (name) this.lookupCache.set(id, name);
    return name;
  }

  protected toggleColumnVisibility(colId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const newColumns = new Set(this.visibleColumns);
    if (newColumns.has(colId)) {
      newColumns.delete(colId);
    } else {
      newColumns.add(colId);
    }
    this.visibleColumns = newColumns;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.COLUMNS_STORAGE_KEY, JSON.stringify(Array.from(this.visibleColumns)));
    }
  }

  protected get visibleColumnCount(): number {
    return this.visibleColumns.size + 2; // Checkbox + Actions
  }

  // Modal states
  protected isEditing = false;
  protected selectedProduct: ExtendedProductDto = this.getEmptyProduct();
  protected productToDelete: ExtendedProductDto | null = null;
  protected viewProduct: ExtendedProductDto | null = null;

  protected isFormModalVisible = false;
  protected isViewModalVisible = false;
  protected isTransferModalVisible = false;

  // Transfer states
  protected productToTransfer: ExtendedProductDto | null = null;
  protected transferTargetDepartmentId = '';
  protected transferQuantity = 1;
  protected transferNotes = '';
  protected isTransferring = false;
  protected parsedContacts: { type: string, value: string }[] = [];
  protected contacts: { type: string, value: string }[] = [{ type: 'Phone', value: '' }];

  // Image states
  protected selectedImage: File | null = null;
  protected imagePreview: string | ArrayBuffer | null = null;
  protected imageLoading = false;
  protected isUploading = false;
  protected imageUploadProgress = 0;
  protected selectedImageUrl: string | null = null;
  
  protected isImporting = false;
  protected importErrors: string[] = [];
  protected importProgress = 0;
  protected importStatusMessage = '';
  private hubConnection: signalR.HubConnection | null = null;
  private signalRTimeoutId: any;

  protected purchaseHistory: ProductPurchaseHistoryDto[] = [];
  protected historyLoading = false;

  protected get disablePurchaseFields(): boolean {
    return this.isEditing && this.historyLoading;
  }

  protected get currentPageValue(): number {
    return this.products.reduce((sum, p) => sum + (p.price || 0), 0);
  }

  protected getTotalPurchased(): number {
    return this.purchaseHistory.reduce((sum, item) => sum + item.quantity, 0);
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadLookups();
    this.initSignalR();
  }

  ngOnDestroy(): void {
    if (this.signalRTimeoutId) {
      clearTimeout(this.signalRTimeoutId);
    }
    this.hubConnection?.stop();
  }

  private initSignalR(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/import`, {
        accessTokenFactory: () => {
          return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
        }
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ImportProgress', (progress: number, message: string) => {
      this.importProgress = progress;
      this.importStatusMessage = message;
      this.cdr.detectChanges();
    });

    this.hubConnection.on('ImportCompleted', (result: any) => {
      this.isImporting = false;
      this.importProgress = 0;
      if (result.errors && result.errors.length > 0) {
        this.showMessage('warning', 'Import Partially Successful', `Imported ${result.importedCount} products. Encountered ${result.errors.length} row errors.`);
        this.importErrors = result.errors;
      } else {
        this.showMessage('success', 'Import Successful', `Successfully imported ${result.importedCount} products!`);
      }
      this.loadProducts();
      this.cdr.detectChanges();
    });

    this.hubConnection.on('ImportFailed', (error: string) => {
      this.isImporting = false;
      this.importProgress = 0;
      this.showMessage('error', 'Import Failed', error);
      this.cdr.detectChanges();
    });

    this.hubConnection.start().catch((err: any) => console.error('SignalR Connection Error: ', err));
    this.signalRTimeoutId = setTimeout(() => {
      this.hubConnection?.start().catch((err: any) => console.error('SignalR Connection Error: ', err));
    }, 50);
  }

  protected loadLookups(): void {
    this.lookupsLoading = true;
    // Fetch lookups directly via HttpClient to bypass missing methods in ProductApiService
    forkJoin({
      categories: this.categoryApi.list().pipe(catchError(() => of([]))),
      brands: this.http.get<BrandDto[]>(`${this.baseUrl}/api/Brand`).pipe(catchError(() => of([]))),
      departments: this.http.get<DepartmentDto[]>(`${this.baseUrl}/api/Department`).pipe(catchError(() => of([]))),
      persons: this.http.get<PersonDto[]>(`${this.baseUrl}/api/Person`).pipe(catchError(() => of([]))),
      suppliers: this.http.get<SupplierDto[]>(`${this.baseUrl}/api/Supplier`).pipe(catchError(() => of([]))),
      qualities: this.http.get<any[]>(`${this.baseUrl}/api/Quality`).pipe(catchError(() => of([])))
    }).subscribe({
      next: (results: any) => {
        this.lookupCache.clear();
        const getUnique = (arr: any[] | null | undefined, key: string) => {
          const map = new Map();
          for (const item of arr ?? []) {
            const val = item[key];
            if (val && typeof val === 'string') {
              map.set(val.toLowerCase().trim(), item);
            }
          }
          return Array.from(map.values());
        };

        this.categories = getUnique(results.categories, 'name').sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        this.brands = getUnique(results.brands, 'name').sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        this.departments = getUnique(results.departments, 'name').sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        this.persons = getUnique(results.persons, 'fullName').sort((a: any, b: any) => (a.fullName || '').localeCompare(b.fullName || ''));
        this.suppliers = getUnique(results.suppliers, 'name').sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        this.qualities = getUnique(results.qualities, 'name').sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        this.lookupsLoading = false;
        this.sortProductsLocally();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading lookups:', err);
        this.lookupsLoading = false;
        this.showMessage('error', 'Lookup Error', 'Failed to load dropdown data. Some fields may not have suggestions.');
      }
    });
  }

  protected loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.selectedProducts.clear();

    const query: QueryOptions = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    // Add sorting
    if (this.sortBy) {
      query.sortBy = this.sortBy;
      query.isAscending = this.isAscending;
    }

    // Find IDs based on selected filter names
    const selectedCat = this.categories.find(c => c.name === this.filterCategory);
    const selectedDept = this.departments.find(d => d.name === this.filterDepartment);
    const selectedQuality = this.qualities.find(q => q.name === this.filterQuality);

    if (selectedCat?.id) (query as any).categoryId = selectedCat.id;
    if (selectedDept?.id) (query as any).departmentId = selectedDept.id;
    if (selectedQuality?.id) (query as any).qualityId = selectedQuality.id;
    if (this.filterPurchaseType) (query as any).purchaseType = this.filterPurchaseType;

    if (this.filterPrice === 'under100') {
      (query as any).maxPrice = 99.99;
    } else if (this.filterPrice === 'equal100') {
      (query as any).minPrice = 100;
      (query as any).maxPrice = 100;
    } else if (this.filterPrice === 'over100') {
      (query as any).minPrice = 100.01;
    }

    // Fallback for free-text filters that don't have IDs
    if (this.filterCategory && !selectedCat?.id) {
      query.filterOn = 'categoryName';
      query.filterQuery = this.filterCategory;
    } else if (this.filterDepartment && !selectedDept?.id) {
      query.filterOn = 'departmentName';
      query.filterQuery = this.filterDepartment;
    } else if (this.filterQuality && !selectedQuality?.id) {
      query.filterOn = 'quality';
      query.filterQuery = this.filterQuality;
    }

    // Add search filter
    if (this.search && this.search.trim() !== '') {
      (query as any).name = this.search.trim();
    }

    let params = new HttpParams();
    Object.keys(query).forEach(key => {
      const val = (query as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.append(key, val.toString());
      }
    });

    this.http.get<any>(this.apiUrl, { params }).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (result) => {
        if (result) {
          this.products = result.items || [];
          this.totalItems = result.totalCount || 0;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.sortProductsLocally();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load products. Please try again.';
        console.error('Error loading products:', err);
      }
    });
  }

  protected getEmptyProduct(): ExtendedProductDto {
    return {
      id: null,
      name: '',
      codeNumber: null,
      description: null,
      categoryId: null,
      categoryName: null,
      brandId: null,
      brandName: null,
      departmentId: null,
      departmentName: null,
      price: null,
      imageUrl: null,
      attributes: null,
      qualityId: null,
      year: null,
      plateNumber: null,
      engineNumber: null,
      purchaseType: null,
      initialQuantity: null,
      supplierName: null,
      donorName: null,
      voucherNumber: null,
      supplierContact: null,
      invoiceDate: null,
      responsiblePersonId: null,
      quality: null,
      responsiblePerson: null,
      createdDate: null,
      updateDate: null,
    };
  }
  
  protected get isAllSelected(): boolean {
    if (this.products.length === 0) return false;
    return this.products.every(p => p.id && this.selectedProducts.has(p.id));
  }

  protected toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedProducts.clear();
    } else {
      this.products.forEach(p => p.id && this.selectedProducts.add(p.id));
    }
  }

  protected toggleSelection(productId: string | null): void {
    if (!productId) return;
    this.selectedProducts.has(productId) ? this.selectedProducts.delete(productId) : this.selectedProducts.add(productId);
  }

  protected goToPage(page: number | string): void {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    if (pageNum >= 1 && pageNum <= this.totalPages && pageNum !== this.currentPage) {
      this.currentPage = pageNum;
      this.loadProducts();
    }
  }

  protected onPageSizeChange(value: number | string): void {
    this.pageSize = typeof value === 'string' ? parseInt(value, 10) : value;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.PAGE_SIZE_STORAGE_KEY, this.pageSize.toString());
    }
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

  protected sortProductsLocally(): void {
    if (!this.sortBy || this.products.length === 0) return;

    this.products.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (this.sortBy) {
        case 'department':
          valA = a.departmentName || this.getLookupName(this.departments, a.departmentId) || '';
          valB = b.departmentName || this.getLookupName(this.departments, b.departmentId) || '';
          break;
        case 'category':
          valA = a.categoryName || this.getLookupName(this.categories, a.categoryId) || '';
          valB = b.categoryName || this.getLookupName(this.categories, b.categoryId) || '';
          break;
        case 'brand':
          valA = a.brandName || this.getLookupName(this.brands, a.brandId) || '';
          valB = b.brandName || this.getLookupName(this.brands, b.brandId) || '';
          break;
        default:
          valA = (a as any)[this.sortBy] || '';
          valB = (b as any)[this.sortBy] || '';
          break;
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.isAscending ? -1 : 1;
      if (valA > valB) return this.isAscending ? 1 : -1;
      return 0;
    });
    
    this.products = [...this.products]; // Force instant UI re-render
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
    this.contacts = [{ type: 'Phone', value: '' }];
    this.clearImageState();
    this.isFormModalVisible = true;
  }

  private parseContactString(contactData: any): { type: string, value: string }[] {
    if (!contactData) {
      return [];
    }
    if (typeof contactData === 'object') {
      return Object.keys(contactData).map(k => ({ type: k, value: contactData[k] }));
    }
    return String(contactData).split(' | ').map(part => {
      const [type, ...rest] = part.split(': ');
      return { type: type || 'Unknown', value: rest.join(': ') || '' };
    }).filter(contact => contact.value !== '');
  }


  protected openViewModal(product: ProductDto): void {
    this.viewProduct = { ...product };
    this.parsedContacts = this.parseContactString(product.supplierContact);
    
    this.historyLoading = true;
    this.purchaseHistory = [];
    
    if (product.id) {
      this.http.get<ExtendedProductDto>(`${this.apiUrl}/${product.id}`).subscribe({
        next: (fullProduct: ExtendedProductDto) => {
          this.viewProduct = fullProduct;
          this.purchaseHistory = fullProduct.purchaseHistory || [];
          this.historyLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.historyLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.historyLoading = false;
    }

    this.isViewModalVisible = true;
  }

  protected closeViewModal(): void {
    this.isViewModalVisible = false;
  }

  protected closeViewAndEdit(): void {
    this.closeViewModal();
    if (this.viewProduct) {
      setTimeout(() => {
        this.openEditModal(this.viewProduct!);
      }, 300);
    }
  }

  protected openEditModal(product: ExtendedProductDto): void {
    this.isEditing = true;
    this.selectedProduct = { ...product };
    this.selectedImageUrl = product.imageUrl || null;
    this.imagePreview = product.imageUrl || null;
    this.selectedImage = null;
    
    this.historyLoading = true;
    this.purchaseHistory = [];
    
    if (product.id) {
      this.http.get<ExtendedProductDto>(`${this.apiUrl}/${product.id}`).subscribe({
        next: (fullProduct: ExtendedProductDto) => {
          this.purchaseHistory = fullProduct.purchaseHistory || [];
          this.selectedProduct = fullProduct;
          if (fullProduct.supplierContact) {
            this.contacts = this.parseContactString(fullProduct.supplierContact);
            if (this.contacts.length === 0) this.contacts.push({ type: 'Phone', value: '' });
          } else {
            this.contacts = [{ type: 'Phone', value: '' }];
          }
          this.historyLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.historyLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.historyLoading = false;
    }

    this.isFormModalVisible = true;
  }

  protected closeModal(): void {
    this.isFormModalVisible = false;
    this.clearImageState();
  }

  protected saveProduct(): void {
    if (!this.selectedProduct.name || this.selectedProduct.price === null || this.selectedProduct.price === undefined) {
      this.showMessage('error', 'Validation Error', 'Product name and price are required.');
      return;
    }

    this.isUploading = true;
    this.imageLoading = true;

    const performSave = () => {
      const finalizeAndClose = (success: boolean, action: string, productName: string, errorMsg?: string, keepOpen = false) => {
        this.isUploading = false;
        this.imageLoading = false;
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.loadProducts();
          if (!keepOpen) {
            this.closeModal();
          }
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
        this.http.put<ExtendedProductDto>(`${this.apiUrl}/${this.selectedProduct.id}`, this.selectedProduct).subscribe({
          next: (updated) => {
          // Upload image if selected
          if (this.selectedImage && updated?.id) {
            this.uploadProductImage(updated.id)
              .then(() => {
                this.refreshAfterEdit(updated.id!);
                finalizeAndClose(true, 'Update', this.selectedProduct.name, undefined, true);
              })
              .catch((err) => {
                console.error('Image upload failed:', err);
                this.refreshAfterEdit(updated.id!);
                finalizeAndClose(false, 'Update', this.selectedProduct.name, undefined, true);
              });
          } else {
            this.refreshAfterEdit(updated?.id || this.selectedProduct.id!);
            finalizeAndClose(true, 'Update', this.selectedProduct.name, undefined, true);
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
        const createRequest: any = {
        name: this.selectedProduct.name,
        codeNumber: this.selectedProduct.codeNumber,
        description: this.selectedProduct.description,
        categoryId: this.selectedProduct.categoryId,
        categoryName: this.selectedProduct.categoryName,
        brandId: this.selectedProduct.brandId,
        brandName: this.selectedProduct.brandName,
        departmentId: this.selectedProduct.departmentId,
        departmentName: this.selectedProduct.departmentName,
        price: this.selectedProduct.price,
        quality: this.selectedProduct.quality,
        qualityId: this.selectedProduct.qualityId,
        attributes: this.selectedProduct.attributes,
        year: this.selectedProduct.year,
        plateNumber: this.selectedProduct.plateNumber,
        engineNumber: this.selectedProduct.engineNumber,
        purchaseType: this.selectedProduct.purchaseType,
        initialQuantity: this.selectedProduct.initialQuantity,
        supplierName: this.selectedProduct.supplierName,
        donorName: this.selectedProduct.donorName,
        voucherNumber: this.selectedProduct.voucherNumber,
        supplierContact: this.selectedProduct.supplierContact,
        invoiceDate: this.selectedProduct.invoiceDate,
        responsiblePerson: this.selectedProduct.responsiblePerson,
        responsiblePersonId: this.selectedProduct.responsiblePersonId,
      };

        this.http.post<ExtendedProductDto>(this.apiUrl, createRequest).subscribe({
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
    };

    // Auto-create Responsible Person first if they are new
    if (this.selectedProduct.purchaseType && this.selectedProduct.purchaseType !== 'None' && this.selectedProduct.responsiblePerson && !this.selectedProduct.responsiblePersonId) {
      this.http.post<PersonDto>(`${this.baseUrl}/api/Person`, { fullName: this.selectedProduct.responsiblePerson }).subscribe({
        next: (newPerson) => {
          this.selectedProduct.responsiblePersonId = newPerson.id;
          this.persons.push(newPerson);
          performSave();
        },
        error: (err) => {
          console.warn('Failed to auto-create person', err);
          performSave(); // Continue anyway, backend might support raw string mapping
        }
      });
    } else {
      performSave();
    }
  }

  protected refreshAfterEdit(id: string): void {
    this.historyLoading = true;
    
    this.http.get<ExtendedProductDto>(`${this.apiUrl}/${id}`).subscribe({
        next: (fullProduct: ExtendedProductDto) => {
          this.purchaseHistory = fullProduct.purchaseHistory || [];
          this.selectedProduct = fullProduct;
          if (fullProduct.supplierContact) {
            this.contacts = this.parseContactString(fullProduct.supplierContact);
            if (this.contacts.length === 0) this.contacts.push({ type: 'Phone', value: '' });
          } else {
            this.contacts = [{ type: 'Phone', value: '' }];
          }
          this.historyLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.historyLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  protected openTransferModal(product: ExtendedProductDto): void {
    this.productToTransfer = product;
    this.transferTargetDepartmentId = '';
    this.transferQuantity = 1;
    this.transferNotes = '';
    this.isTransferModalVisible = true;
  }

  protected closeTransferModal(): void {
    this.isTransferModalVisible = false;
  }

  protected executeTransfer(): void {
    if (!this.productToTransfer?.id || !this.transferTargetDepartmentId) return;
    this.isTransferring = true;

    const payload = {
      productId: this.productToTransfer.id,
      fromDepartmentId: this.productToTransfer.departmentId,
      toDepartmentId: this.transferTargetDepartmentId,
      quantity: this.transferQuantity,
      notes: this.transferNotes
    };

    this.http.post(`${this.apiUrl}/${this.productToTransfer.id}/transfer`, payload).subscribe({
      next: () => {
        this.isTransferring = false;
        this.closeTransferModal();
        this.loadProducts();
        this.showMessage('success', 'Transfer Successful', `Stock has been transferred to the new department.`);
      },
      error: (err) => {
        this.isTransferring = false;
        this.showMessage('error', 'Transfer Failed', 'Could not transfer stock. Please try again.');
        console.error('Error transferring stock:', err);
      }
    });
  }

  protected confirmDelete(product: ExtendedProductDto): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the product <strong>${product.name}</strong>?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.productToDelete = product;
        this.executeDelete();
      },
      reject: () => {
        this.productToDelete = null;
      }
    });
  }

  protected executeDelete(): void {
    if (!this.productToDelete?.id) return;

    this.http.delete(`${this.apiUrl}/${this.productToDelete.id}`).subscribe({
      next: () => {
        this.loadProducts();
        this.showMessage('success', 'Product Deleted', `${this.productToDelete!.name} has been deleted.`);
        this.productToDelete = null; // Clear after use
      },
      error: (err) => {
        this.showMessage('error', 'Delete Failed', 'Could not delete the product. Please try again.');
        console.error('Error deleting product:', err);
        this.productToDelete = null; // Clear after use
      }
    });
  }

  protected confirmBulkDelete(): void {
    this.confirmationService.confirm({
        message: `Are you sure you want to delete ${this.selectedProducts.size} selected products? This action cannot be undone.`,
        header: 'Confirm Bulk Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            this.executeBulkDelete();
        }
    });
  }

  protected executeBulkDelete(): void {
    if (this.selectedProducts.size === 0) return;

    const deleteRequests = Array.from(this.selectedProducts).map(id => this.http.delete(`${this.apiUrl}/${id}`));

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.showMessage('success', 'Bulk Delete Successful', `${this.selectedProducts.size} products have been deleted.`);
        this.loadProducts(); // This will also clear selections
      },
      error: (err) => {
        this.showMessage('error', 'Bulk Delete Failed', 'Some products could not be deleted. Please try again.');
        console.error('Error during bulk delete:', err);
      }
    });
  }

  protected showMessage(type: 'success' | 'error' | 'warning', title: string, content: string): void {
    // Map 'warning' to PrimeNG's 'warn' severity
    const severity = type === 'warning' ? 'warn' : type;
    this.messageService.add({ severity, summary: title, detail: content, life: 4000 });
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
      this.http.delete(`${this.apiUrl}/${this.selectedProduct.id}/image`).subscribe({
        next: () => {
          this.selectedProduct.imageUrl = null;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error removing image:', err)
      });
    }
  }

  protected async handleImportExcel(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isImporting = true;
    this.cdr.detectChanges();

    try {
      // Send the raw file directly to the API. Let the C# backend handle empty rows and parsing.
      // This prevents browser memory crashes on large Excel files.
      const formData = new FormData();
      formData.append('file', file);

      this.http.post<any>(`${this.apiUrl}/import`, formData).subscribe({
        next: (result) => {
          if (result.trackingId && this.hubConnection) {
             this.hubConnection.invoke('JoinJobGroup', result.trackingId).catch(console.error);
          }
          this.importStatusMessage = 'File uploaded. Waiting for background processor...';
          this.importProgress = 0;
          input.value = '';
          this.cdr.detectChanges();
        },
        error: (err) => {
          const message = err.error?.title || err.error?.message || 'Failed to import products.';
          this.showMessage('error', 'Import Failed', message);
          this.isImporting = false;
          input.value = '';
          this.cdr.detectChanges();
        }
      });
    } catch (err: any) {
      this.showMessage('error', 'Import Failed', err.message || 'An unexpected error occurred during import preparation.');
      this.isImporting = false;
      input.value = '';
      this.cdr.detectChanges();
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

      const formData = new FormData();
      formData.append('file', fileToUpload);

      this.http.post<{ imageUrl: string }>(`${this.apiUrl}/${productId}/image`, formData).subscribe({
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
    this.http.delete(`${this.apiUrl}/${productId}/image`).subscribe({
      next: () => {
        this.selectedProduct.imageUrl = null;
        this.selectedImageUrl = null;
        this.imagePreview = null;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error deleting product image:', err)
    });
  }

  protected onQualityChange(qualityId: string): void {
    const selectedQuality = this.qualities.find(q => q.id === qualityId);
    if (selectedQuality) {
      this.selectedProduct.quality = selectedQuality.name;
    } else {
      this.selectedProduct.quality = null;
    }
  }

  protected onCategoryNameChange(categoryName: string): void {
    if (!categoryName) {
      this.selectedProduct.categoryId = null;
      this.selectedProduct.categoryName = null;
      return;
    }
    const selectedCategory = this.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (selectedCategory) {
      this.selectedProduct.categoryId = selectedCategory.id;
      this.selectedProduct.categoryName = selectedCategory.name;
    } else {
      this.selectedProduct.categoryId = null;
      this.selectedProduct.categoryName = categoryName;
    }
  }

  protected onBrandNameChange(brandName: string): void {
    if (!brandName) {
      this.selectedProduct.brandId = null;
      this.selectedProduct.brandName = null;
      return;
    }
    const selectedBrand = this.brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    if (selectedBrand) {
      this.selectedProduct.brandId = selectedBrand.id;
      this.selectedProduct.brandName = selectedBrand.name;
    } else {
      this.selectedProduct.brandId = null;
      this.selectedProduct.brandName = brandName;
    }
  }

  // --- Autocomplete Methods ---
  protected onAutocompleteInput(type: 'category' | 'brand' | 'department' | 'person' | 'supplier', value: string) {
    this.filterSuggestions(type, value);

    const nameProp = (type === 'person' ? 'responsiblePerson' : type + 'Name') as keyof ExtendedProductDto;
    const idProp = (type === 'person' ? 'responsiblePersonId' : type + 'Id') as keyof ExtendedProductDto;
    (this.selectedProduct as any)[nameProp] = value;

    let source: any[] = [];
    let nameField = 'name';
    switch (type) {
        case 'category': source = this.categories; break;
        case 'brand': source = this.brands; break;
        case 'department': source = this.departments; break;
        case 'person': source = this.persons; nameField = 'fullName'; break;
        case 'supplier': source = this.suppliers; break;
    }
    const exactMatch = source.find(item => item[nameField].toLowerCase() === value.toLowerCase());
    if (exactMatch) {
        (this.selectedProduct as any)[idProp] = exactMatch.id;
    } else {
        (this.selectedProduct as any)[idProp] = null;
    }
  }

  protected filterSuggestions(type: 'category' | 'brand' | 'department' | 'person' | 'supplier', inputValue: string) {
    const input = (inputValue || '').toLowerCase();
    let source: any[] = [];
    let nameField = 'name';

    switch (type) {
      case 'category': source = this.categories; break;
      case 'brand': source = this.brands; break;
      case 'department': source = this.departments; break;
      case 'person': source = this.persons; nameField = 'fullName'; break;
      case 'supplier': source = this.suppliers; break;
    }

    let suggestions = source.filter(item => item[nameField].toLowerCase().includes(input));

    const isExisting = source.some(item => item[nameField].toLowerCase() === input);
    if (input && !isExisting) {
      suggestions.push({ [nameField]: `Add "${input}"`, isNew: true, newName: input });
    }

    this.filteredSuggestions[type] = suggestions;
    this.showSuggestions[type] = true;
  }

  protected selectSuggestion(type: 'category' | 'brand' | 'department' | 'person' | 'supplier', suggestion: any) {
    const nameField = type === 'person' ? 'fullName' : 'name';
    const nameProp = (type === 'person' ? 'responsiblePerson' : type + 'Name') as keyof ExtendedProductDto;
    const idProp = (type === 'person' ? 'responsiblePersonId' : type + 'Id') as keyof ExtendedProductDto;

    (this.selectedProduct as any)[nameProp] = suggestion.isNew ? suggestion.newName : suggestion[nameField];
    (this.selectedProduct as any)[idProp] = suggestion.isNew ? null : suggestion.id;
    this.showSuggestions[type] = false;
  }

  protected onAutocompleteEnter(type: 'category' | 'brand' | 'department' | 'person' | 'supplier', event: Event) {
    event.preventDefault();
    const suggestions = this.filteredSuggestions[type];
    if (suggestions && suggestions.length > 0) {
      this.selectSuggestion(type, suggestions[0]);
    }
    this.showSuggestions[type] = false;
  }

  protected hideSuggestionsDelayed(type: string) {
    this.suggestionTimeout = setTimeout(() => {
      this.showSuggestions[type] = false;
    }, 150);
  }

  protected cancelHideSuggestions() {
    clearTimeout(this.suggestionTimeout);
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

  protected isPredefinedContactType(type: string): boolean {
    return ['Phone', 'Email'].includes(type);
  }

  protected getContactSelectValue(type: string): string {
    return this.isPredefinedContactType(type) ? type : 'Other';
  }

  protected onContactTypeChange(contact: { type: string, value: string }, newValue: string): void {
    // When 'Other' is selected, we clear the type to allow for custom input.
    contact.type = newValue === 'Other' ? '' : newValue;
    this.updateSupplierContact();
  }

  protected updateSupplierContact(): void {
    const combined = this.contacts
      .filter(c => c.value.trim() !== '')
      .map(c => `${c.type || 'Unknown'}: ${c.value}`)
      .join(' | ');
    
    this.selectedProduct.supplierContact = combined || null;
  }

  protected addContact(): void {
    this.contacts.push({ type: 'Phone', value: '' });
  }

  protected removeContact(index: number): void {
    this.contacts.splice(index, 1);
    this.updateSupplierContact();
  }

  protected onYearChange(yearStr: string | null): void {
    if (yearStr) { // yearStr is 'yyyy-MM-dd'
      this.selectedProduct.year = new Date(yearStr).toISOString();
    } else {
      this.selectedProduct.year = null;
    }
  }

  // ===== EXPORT METHODS =====

  private getColumnValue(product: ExtendedProductDto, colId: string, isCsv: boolean = false): string {
    const fallback = isCsv ? '' : '-';
    switch (colId) {
      case 'name': return product.name || fallback;
      case 'codeNumber': return product.codeNumber || fallback;
      case 'year': return product.year ? product.year.toString().substring(0, 4) : fallback;
      case 'plateNumber': return product.plateNumber || fallback;
      case 'engineNumber': return product.engineNumber || fallback;
      case 'category': return product.categoryName || this.getLookupName(this.categories, product.categoryId) || fallback;
      case 'brand': return product.brandName || this.getLookupName(this.brands, product.brandId) || fallback;
      case 'department': return product.departmentName || this.getLookupName(this.departments, product.departmentId) || fallback;
      case 'quality': return product.quality || this.getLookupName(this.qualities, product.qualityId) || fallback;
      case 'responsiblePerson': return product.responsiblePerson || this.getLookupName(this.persons, product.responsiblePersonId) || fallback;
      case 'initialQuantity': return product.initialQuantity?.toString() || fallback;
      case 'voucherNumber': return product.voucherNumber || fallback;
      case 'donorName': return product.donorName || fallback;
      case 'supplier': 
        let contactStr = '';
        if (product.supplierContact) {
          contactStr = typeof product.supplierContact === 'string' ? product.supplierContact : Object.entries(product.supplierContact).map(([k, v]) => `${k}: ${v}`).join(' | ');
        } else if (product.supplierContactList && product.supplierContactList.length > 0) {
          contactStr = product.supplierContactList.join(' | ');
        }
        return product.supplierName ? `${product.supplierName}${contactStr ? ` (${contactStr})` : ''}` : fallback;
      case 'purchaseType': return product.purchaseType || fallback;
      case 'price': return product.price != null ? `$${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : fallback;
      case 'description': return product.description || fallback;
      default: return fallback;
    }
  }

  private getGroupedExportRows(activeColumns: any[], isCsv: boolean, isExcel: boolean): any[] {
    // Sort products by name to group them together for subtotals
    const sortedProducts = [...this.products].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const rows: any[] = [];
    let currentName = '';
    let subTotal = 0;
    let grandTotal = 0;
    let itemCount = 0;
    const hasPrice = activeColumns.some(c => c.id === 'price');

    const formatPrice = (val: number) => {
      if (isExcel) return val;
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const flushSubtotal = () => {
      // Only show a subtotal row if there is more than 1 item with the same name
      if (currentName !== '' && hasPrice && itemCount > 1) {
        const subRow: any = {};
        activeColumns.forEach((col, idx) => {
          if (idx === 0) {
            subRow[col.id] = `Subtotal (${currentName})`;
          } else if (col.id === 'price') {
            subRow[col.id] = formatPrice(subTotal);
          } else {
            subRow[col.id] = '';
          }
        });
        subRow._isSubtotal = true;
        rows.push(subRow);
      }
    };

    sortedProducts.forEach(p => {
      const pName = p.name || 'Unknown';
      if (pName !== currentName) {
        flushSubtotal();
        currentName = pName;
        subTotal = 0;
        itemCount = 0;
      }

      const rowData: any = {};
      activeColumns.forEach(col => {
        rowData[col.id] = (isExcel && col.id === 'price') ? (p.price || 0) : this.getColumnValue(p, col.id, isCsv);
      });
      rows.push(rowData);

      subTotal += (p.price || 0);
      grandTotal += (p.price || 0);
      itemCount++;
    });

    flushSubtotal(); // Flush the final group

    if (hasPrice && rows.length > 0) {
      const totalRow: any = {};
      activeColumns.forEach((col, idx) => {
        if (idx === 0) {
          totalRow[col.id] = 'Grand Total';
        } else if (col.id === 'price') {
          totalRow[col.id] = formatPrice(grandTotal);
        } else {
          totalRow[col.id] = '';
        }
      });
      totalRow._isTotal = true;
      rows.push(totalRow);
    }

    return rows;
  }

  protected async exportToExcel(): Promise<void> {
    if (this.products.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    const activeColumns = this.availableColumns.filter(col => this.visibleColumns.has(col.id));
    
    worksheet.columns = activeColumns.map(col => ({
      header: col.label,
      key: col.id,
      width: 20
    }));

    const rowsData = this.getGroupedExportRows(activeColumns, false, true);

    rowsData.forEach(row => {
      const worksheetRow = worksheet.addRow(row);
      if (row._isSubtotal || row._isTotal) {
        worksheetRow.font = { bold: true };
      }
    });

    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_${this.getTimestamp()}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected exportToCSV(): void {
    if (this.products.length === 0) return;

    const activeColumns = this.availableColumns.filter(col => this.visibleColumns.has(col.id));
    const headers = activeColumns.map(col => col.label);
    
    // CSV Rows
    const rows = this.products.map(p => 
      activeColumns.map(col => this.escapeCsvValue(this.getColumnValue(p, col.id, true)))
    );

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
// Export pdf
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
    
    const activeColumns = this.availableColumns.filter(col => this.visibleColumns.has(col.id));
    const headers = activeColumns.map(col => col.label);

      const rowsData = this.getGroupedExportRows(activeColumns, false, false);
    // Table
      const tableData = rowsData.map(r => 
        activeColumns.map(col => r[col.id] != null ? String(r[col.id]) : '')
    );

    const priceIndex = activeColumns.findIndex(c => c.id === 'price');
    const customColumnStyles: any = { 0: { cellWidth: 35 } };
    if (priceIndex !== -1) {
      customColumnStyles[priceIndex] = { cellWidth: 20, halign: 'right' };
    }

    autoTable(doc, {
      startY: filterInfo ? 35 : 30,
      head: [headers],
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
        columnStyles: customColumnStyles,
        didParseCell: (data: any) => {
          const rowData = rowsData[data.row.index];
          if (rowData && (rowData._isSubtotal || rowData._isTotal)) {
            data.cell.styles.fontStyle = 'bold';
            if (rowData._isTotal) {
              data.cell.styles.fillColor = [220, 220, 220]; // Slightly darker for grand total
            } else {
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
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
// print
  protected printProducts(): void {
    if (this.products.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    const filterInfo = this.getFilterInfo();
    
    const activeColumns = this.availableColumns.filter(col => this.visibleColumns.has(col.id));
    const headersHtml = activeColumns.map(col => `<th>${col.label}</th>`).join('');

      const rowsData = this.getGroupedExportRows(activeColumns, false, false);

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
              ${headersHtml}
            </tr>
          </thead>
          <tbody>
              ${rowsData.map(r => `
                <tr style="${r._isSubtotal || r._isTotal ? 'font-weight: bold; background-color: #e5e7eb;' : ''}">
                  ${activeColumns.map(col => `<td ${col.id === 'price' ? 'style="text-align: right;"' : ''}>${r[col.id] != null ? String(r[col.id]) : ''}</td>`).join('')}
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
    if (this.filterDepartment) filters.push(`Department: ${this.filterDepartment}`);
    if (this.filterQuality) filters.push(`Condition: ${this.filterQuality}`);
    if (this.filterPurchaseType) filters.push(`Acquisition: ${this.filterPurchaseType}`);
    if (this.filterPrice) filters.push(`Price: ${this.filterPrice}`);
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
