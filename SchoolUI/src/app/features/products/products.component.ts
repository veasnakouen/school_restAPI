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
import { SharedModule } from 'primeng/api';

export interface ExtendedProductDto extends ProductDto {
  qualityId?: string | null;
  responsiblePersonId?: string | null;
  attributes?: string | null;
  supplierContactList?: string[] | null;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective, PaginationComponent, TableModule, BadgeModule, ButtonModule, DialogModule, ProgressBarModule, SharedModule],
  template: `
    <section scrollAnimate animateVariant="fade-up" class="app-shell-panel space-y-5 p-5 lg:p-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="space-y-1">
          <div class="flex flex-row items-center gap-2 mb-1">
            <p-badge value="Resource Reporting" severity="info" styleClass="font-semibold tracking-wider text-xs"></p-badge>
          </div>
          <h2 class="text-3xl font-bold tracking-tight text-gray-800">Inventory Report Builder</h2>
          <p class="max-w-2xl text-sm text-gray-500">Filter, analyze, and generate comprehensive reports for your school's resources.</p>
        </div>

        <!-- Quick Summary Stats -->
        <div class="flex flex-row divide-x shadow-sm border border-gray-200 bg-gray-50/50 rounded-lg w-full md:w-auto">
          <div class="flex flex-col py-2 px-4">
            <div class="text-xs font-semibold text-gray-500">Total Resources</div>
            <div class="text-lg font-bold text-blue-600">{{ totalItems }}</div>
          </div>
          <div class="flex flex-col py-2 px-4">
            <div class="text-xs font-semibold text-gray-500">Categories</div>
            <div class="text-lg font-bold text-gray-800">{{ uniqueCategories.length }}</div>
          </div>
          <div class="flex flex-col py-2 px-4">
            <div class="text-xs font-semibold text-gray-500">Page Value</div>
            <div class="text-lg font-bold text-green-600">\${{ currentPageValue | number:'1.2-2' }}</div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <!-- Filters Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end bg-gray-50/50 p-4 rounded-2xl border border-gray-200">
          <div class="flex flex-col w-full">
            <label class="py-1"><span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Search</span></label>
            <input
              [(ngModel)]="search"
              (ngModelChange)="onSearchChange()"
              placeholder="Search products..."
              class="p-inputtext p-component p-inputtext-sm w-full bg-white"
            />
          </div>
          <div class="flex flex-col w-full">
            <label class="py-1"><span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Category</span></label>
            <select
              [(ngModel)]="filterCategory"
              (ngModelChange)="onFilterChange()"
              class="p-inputtext p-component p-inputtext-sm w-full bg-white appearance-none py-1.5"
            >
              <option value="">All Categories</option>
              @for (catName of uniqueCategories; track catName) {
                <option [value]="catName">{{ catName }}</option>
              }
            </select>
          </div>
          <div class="flex flex-col w-full">
            <label class="py-1"><span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Department</span></label>
            <select
              [(ngModel)]="filterDepartment"
              (ngModelChange)="onFilterChange()"
              class="p-inputtext p-component p-inputtext-sm w-full bg-white appearance-none py-1.5"
            >
              <option value="">All Departments</option>
              @for (deptName of uniqueDepartments; track deptName) {
                <option [value]="deptName">{{ deptName }}</option>
              }
            </select>
          </div>
          <div class="flex flex-col w-full">
            <label class="py-1"><span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Condition</span></label>
            <select
              [(ngModel)]="filterQuality"
              (ngModelChange)="onFilterChange()"
              class="p-inputtext p-component p-inputtext-sm w-full bg-white appearance-none py-1.5"
            >
              <option value="">All Conditions</option>
              @for (q of qualities; track q.id) {
                <option [value]="q.name">{{ q.name }}</option>
              }
            </select>
          </div>
          <div class="flex flex-col w-full">
            <label class="py-1"><span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Acquisition</span></label>
            <select
              [(ngModel)]="filterPurchaseType"
              (ngModelChange)="onFilterChange()"
              class="p-inputtext p-component p-inputtext-sm w-full bg-white appearance-none py-1.5"
            >
              <option value="">All Types</option>
              <option value="Purchased">Purchased</option>
              <option value="Donated">Donated</option>
            </select>
          </div>
          <div class="flex flex-col w-full">
            <label class="py-1"><span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Price Range</span></label>
            <select
              [(ngModel)]="filterPrice"
              (ngModelChange)="onFilterChange()"
              class="p-inputtext p-component p-inputtext-sm w-full bg-white appearance-none py-1.5"
            >
              <option value="">All Prices</option>
              <option value="under100">Under $100</option>
              <option value="equal100">Exactly $100</option>
              <option value="over100">Over $100</option>
            </select>
          </div>
        </div>

        <!-- Toolbar: Bulk Actions & Primary Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white py-1">
          <div class="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            @if (selectedProducts.size > 0) {
              <div class="relative group">
                <div tabindex="0" role="button" class="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition flex items-center gap-2 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Selected ({{ selectedProducts.size }})
                </div>
                <ul tabindex="0" class="absolute hidden group-focus-within:block bg-white rounded-lg z-10 w-52 p-2 shadow-lg border border-gray-200 mt-1">
                  <li>
                    <button type="button" (click)="confirmBulkDelete()" class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-red-600 font-semibold">
                      Confirm Delete
                    </button>
                  </li>
                </ul>
              </div>
            }
            <div class="relative group">
              <div tabindex="0" role="button" class="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition flex items-center gap-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                Columns
              </div>
              <ul tabindex="0" class="absolute hidden group-focus-within:block bg-white rounded-lg z-10 w-52 p-2 shadow-lg border border-gray-200 max-h-96 overflow-y-auto mt-1">
                @for (col of availableColumns; track col.id) {
                  <li>
                    <a (click)="toggleColumnVisibility(col.id, $event)" class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" [checked]="visibleColumns.has(col.id)" (click)="$event.stopPropagation(); toggleColumnVisibility(col.id, $event)" />
                      {{ col.label }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 items-center w-full sm:w-auto sm:justify-end">
            <label class="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition flex items-center gap-2 cursor-pointer" [class.opacity-50]="isImporting" [class.cursor-not-allowed]="isImporting">
              @if (isImporting) {
                <i class="pi pi-spin pi-spinner text-xs"></i>
                @if (importProgress > 0) { {{ importProgress }}% } @else { Uploading... }
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Import
              }
              <input type="file" class="hidden" accept=".xlsx" (change)="handleImportExcel($event)" [disabled]="isImporting" />
            </label>

            <div class="relative group">
              <div tabindex="0" role="button" class="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition shadow-sm flex items-center gap-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Generate Report
              </div>
              <ul tabindex="0" class="absolute hidden right-0 group-focus-within:block bg-white rounded-lg z-10 w-40 p-2 shadow-lg border border-gray-200 mt-1">
                <li><button type="button" (click)="exportToExcel()" [disabled]="products.length === 0" class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm flex items-center gap-2 disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Excel</button></li>
                <li><button type="button" (click)="exportToCSV()" [disabled]="products.length === 0" class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm flex items-center gap-2 disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> CSV</button></li>
                <li><button type="button" (click)="exportToPDF()" [disabled]="products.length === 0" class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm flex items-center gap-2 disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> PDF</button></li>
                <li><button type="button" (click)="printProducts()" [disabled]="products.length === 0" class="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm flex items-center gap-2 disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg> Print</button></li>
              </ul>
            </div>

            <button type="button" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer" (click)="openCreateModal()">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              Add Product
            </button>
          </div>

        </div>
      </div>

      <!-- Real-time Progress Bar -->
      @if (isImporting && importProgress > 0) {
        <div class="my-4 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col gap-2">
          <div class="flex justify-between items-center text-sm font-bold text-blue-700">
            <span>{{ importStatusMessage || 'Processing Import...' }}</span>
            <span>{{ importProgress }}%</span>
          </div>
          <p-progressBar [value]="importProgress" [showValue]="false" [style]="{'height': '8px'}"></p-progressBar>
        </div>
      }

      <div class="w-full max-w-full overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm my-6">
        <p-table [value]="products" [loading]="loading" styleClass="p-datatable-striped p-datatable-sm">
          <ng-template pTemplate="header">
              <tr>
                <th class="w-12 text-center">
                  <label>
                    <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                           [checked]="isAllSelected" 
                           (change)="toggleSelectAll()" />
                  </label>
                </th>
                @if (visibleColumns.has('name')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('name')">
                    <div class="flex items-center gap-1">
                      Name
                      @if (sortBy === 'name') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('codeNumber')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('codeNumber')">
                    <div class="flex items-center gap-1">
                      Code Number
                      @if (sortBy === 'codeNumber') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('year')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('year')">
                    <div class="flex items-center gap-1">
                      Year
                      @if (sortBy === 'year') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('plateNumber')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('plateNumber')">
                    <div class="flex items-center gap-1">
                      Plate Number
                      @if (sortBy === 'plateNumber') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('engineNumber')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('engineNumber')">
                    <div class="flex items-center gap-1">
                      Engine/Serial #
                      @if (sortBy === 'engineNumber') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('category')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('category')">
                    <div class="flex items-center gap-1">
                      Category
                      @if (sortBy === 'category') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('brand')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('brand')">
                    <div class="flex items-center gap-1">
                      Brand
                      @if (sortBy === 'brand') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('department')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('department')">
                    <div class="flex items-center gap-1">
                      Department
                      @if (sortBy === 'department') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('quality')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('quality')">
                    <div class="flex items-center gap-1">
                      Condition
                      @if (sortBy === 'quality') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('responsiblePerson')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('responsiblePerson')">
                    <div class="flex items-center gap-1">
                      Responsible Person
                      @if (sortBy === 'responsiblePerson') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('initialQuantity')) {
                  <th class="text-base font-bold cursor-pointer transition-colors text-right" (click)="sortTable('initialQuantity')">
                    <div class="flex items-center justify-end gap-1">
                      Qty
                      @if (sortBy === 'initialQuantity') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('voucherNumber')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('voucherNumber')">
                    <div class="flex items-center gap-1">
                      Voucher #
                      @if (sortBy === 'voucherNumber') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('donorName')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('donorName')">
                    <div class="flex items-center gap-1">
                      Donor
                      @if (sortBy === 'donorName') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('supplier')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('supplierName')">
                    <div class="flex items-center gap-1">
                      Supplier
                      @if (sortBy === 'supplierName') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('purchaseType')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('purchaseType')">
                    <div class="flex items-center gap-1">
                      Acquisition Type
                      @if (sortBy === 'purchaseType') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('price')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('price')">
                    <div class="flex items-center gap-1">
                      Price
                      @if (sortBy === 'price') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                @if (visibleColumns.has('description')) {
                  <th class="text-base font-bold cursor-pointer transition-colors" (click)="sortTable('description')">
                    <div class="flex items-center gap-1">
                      Description
                      @if (sortBy === 'description') {
                        <i class="pi" [ngClass]="isAscending ? 'pi-sort-amount-up-alt' : 'pi-sort-amount-down'"></i>
                      }
                    </div>
                  </th>
                }
                <th class="text-center text-base font-bold">Actions</th>
              </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
                <tr [ngClass]="getQualityRowClass(item.quality || getLookupName(qualities, item.qualityId))">
                  <td>
                    <label>
                      <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" 
                             [checked]="selectedProducts.has(item.id!)" 
                             (change)="toggleSelection(item.id!)" />
                    </label>
                  </td>
                  @if (visibleColumns.has('name')) {
                    <td class="font-medium">{{ item.name }}</td>
                  }
                  @if (visibleColumns.has('codeNumber')) {
                    <td>{{ item.codeNumber || '-' }}</td>
                  }
                  @if (visibleColumns.has('year')) {
                    <td>{{ item.year ? (item.year | date:'yyyy') : '-' }}</td>
                  }
                  @if (visibleColumns.has('plateNumber')) {
                    <td>{{ item.plateNumber || '-' }}</td>
                  }
                  @if (visibleColumns.has('engineNumber')) {
                    <td>{{ item.engineNumber || '-' }}</td>
                  }
                  @if (visibleColumns.has('category')) {
                    <td>{{ item.categoryName || getLookupName(categories, item.categoryId) || '-' }}</td>
                  }
                  @if (visibleColumns.has('brand')) {
                    <td>{{ item.brandName || getLookupName(brands, item.brandId) || '-' }}</td>
                  }
                  @if (visibleColumns.has('department')) {
                    <td>{{ item.departmentName || getLookupName(departments, item.departmentId) || '-' }}</td>
                  }
                  @if (visibleColumns.has('quality')) {
                    <td>{{ item.quality || getLookupName(qualities, item.qualityId) || '-' }}</td>
                  }
                  @if (visibleColumns.has('responsiblePerson')) {
                    <td>{{ item.responsiblePerson || getLookupName(persons, item.responsiblePersonId) || '-' }}</td>
                  }
                  @if (visibleColumns.has('initialQuantity')) {
                    <td class="text-right">{{ item.initialQuantity || '-' }}</td>
                  }
                  @if (visibleColumns.has('voucherNumber')) {
                    <td>{{ item.voucherNumber || '-' }}</td>
                  }
                  @if (visibleColumns.has('donorName')) {
                    <td>{{ item.donorName || '-' }}</td>
                  }
                  @if (visibleColumns.has('supplier')) {
                    <td>
                      <div class="text-sm">{{ item.supplierName || '-' }}</div>
                      @if (item.supplierContact) {
                        <div class="text-xs text-gray-500">{{ item.supplierContact }}</div>
                  } @else if (item.supplierContactList && item.supplierContactList.length > 0) {
                    <div class="text-xs text-gray-500">
                      @for (contact of item.supplierContactList; track contact) {
                        <span class="mr-2">{{contact}}</span>
                      }
                    </div>
                      }
                    </td>
                  }
                  @if (visibleColumns.has('purchaseType')) {
                    <td>
                      @if (item.purchaseType) {
                        <p-badge [value]="item.purchaseType" [severity]="item.purchaseType === 'Donated' ? 'success' : 'info'"></p-badge>
                      } @else {
                        -
                      }
                    </td>
                  }
                  @if (visibleColumns.has('price')) {
                    <td>{{ item.price | number:'1.2-2' }}</td>
                  }
                  @if (visibleColumns.has('description')) {
                    <td class="whitespace-normal">{{ item.description || '-' }}</td>
                  }
                  <td>
                    <div class="flex gap-2 justify-center">
                      <div title="Transfer Stock">
                        <button
                          type="button"
                          aria-label="Transfer stock"
                          class="p-2 rounded-full text-green-600 hover:bg-green-50 transition-colors"
                          (click)="openTransferModal(item)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                      </div>

                      <div title="View Product">
                        <button
                          type="button"
                          aria-label="View product"
                          class="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
                          (click)="openViewModal(item)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                      <div title="Edit Product">
                        <button
                          type="button"
                          aria-label="Edit product"
                          class="p-2 rounded-full text-yellow-600 hover:bg-yellow-50 transition-colors"
                          (click)="openEditModal(item)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                      <div title="Delete Product">
                        <button
                          type="button"
                          aria-label="Delete product"
                          class="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors"
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
          </ng-template>
          <ng-template pTemplate="emptymessage">
                <tr>
                  <td [attr.colspan]="visibleColumnCount" class="py-10 text-center text-gray-500">No products match your search.</td>
                </tr>
          </ng-template>
        </p-table>

        <!-- Custom pagination is kept to ensure your loadProducts() logic still works perfectly! -->
            @if (totalItems > 0) {
          <div class="p-2 border-t border-gray-200 bg-white">
                  <app-pagination 
                    [totalItems]="totalItems" 
                    [pageSize]="pageSize" 
                    [currentPage]="currentPage"
                    (pageChange)="goToPage($event)"
                    (pageSizeChange)="onPageSizeChange($event)">
                  </app-pagination>
          </div>
            }
      </div>

      @if (errorMessage) {
        <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200">{{ errorMessage }}</div>
      }
    </section>

    <!-- Edit/Create Product Modal -->
    <p-dialog [header]="isEditing ? 'Edit Product' : 'Create New Product'" [(visible)]="isFormModalVisible" [modal]="true" [style]="{width: '100%', maxWidth: '800px'}">
        <form (ngSubmit)="saveProduct()" #productForm="ngForm" class="space-y-4 pt-2">
          <!-- Top Section: Image on Right, Name/Code on Left -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Left: Product Name & Code Number -->
            <div class="md:col-span-2 space-y-4">
              <div class="flex flex-col w-full">
                <label class="py-2">
                  <span class="font-semibold text-gray-700 text-sm">Product Name <span class="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="selectedProduct.name"
                  name="name"
                  required
                  placeholder="e.g. Laptop Dell XPS 15"
                  class="p-inputtext p-component w-full"
                />
              </div>

              <div class="flex flex-col w-full mt-4">
                <label class="py-2">
                  <span class="font-semibold text-gray-700 text-sm">Code Number</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="selectedProduct.codeNumber"
                  name="codeNumber"
                  placeholder="e.g. PROD-001"
                  class="p-inputtext p-component w-full"
                />
              </div>
            </div>

            <!-- Right: Image Upload Area -->
            <div class="flex flex-col items-center gap-3">
              <div class="relative w-full max-w-[160px] mx-auto aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-500 transition-colors cursor-pointer"
                   (click)="triggerImageUpload()">
                @if (imagePreview) {
                  <img [src]="imagePreview" alt="Product preview" class="w-full h-full object-cover" />
                  <!-- Overlay actions -->
                  <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      class="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
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
                      class="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                      (click)="$event.stopPropagation(); removeImage()"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                } @else {
                  <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-sm font-medium">Click to upload</span>
                    <span class="text-xs mt-1">Image</span>
                  </div>
                }
                
                <!-- Loading overlay -->
                @if (imageLoading) {
                  <div class="absolute inset-0 bg-gray-200/80 flex items-center justify-center">
                    <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
                  </div>
                }
              </div>
              
              <!-- Upload button below image -->
              <label class="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer w-full">
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
          <div class="border-t border-gray-200 my-4"></div>

          <!-- Rest of Form Fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col w-full">
              <label class="py-2">
                <span class="font-semibold text-gray-700 text-sm">Category</span>
              </label>
              <div class="relative">
                <input type="text" [ngModel]="selectedProduct.categoryName" (ngModelChange)="onAutocompleteInput('category', $event)" name="categoryName" class="p-inputtext p-component w-full pr-14" placeholder="Select or type new category..." (focus)="filterSuggestions('category', selectedProduct.categoryName || '')" (blur)="hideSuggestionsDelayed('category')" (keydown.enter)="onAutocompleteEnter('category', $event)" autocomplete="off" />
                <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  @if (lookupsLoading) {
                    <i class="pi pi-spin pi-spinner text-gray-400"></i>
                  }
                  @if (selectedProduct.categoryName) {
                    <button type="button" class="p-1 text-gray-400 hover:text-gray-600 rounded-full transition" (mousedown)="$event.preventDefault(); onAutocompleteInput('category', '')">✕</button>
                  }
                </div>
                @if (showSuggestions['category'] && (filteredSuggestions['category']?.length ?? 0) > 0) {
                  <ul class="absolute z-50 w-full bg-gray-50 shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto" (mousedown)="cancelHideSuggestions()">
                    @for (suggestion of filteredSuggestions['category']; track suggestion) {
                      <li (mousedown)="selectSuggestion('category', suggestion)" class="p-2 hover:bg-gray-200 cursor-pointer">
                        {{ suggestion.name }} @if (suggestion.isNew) { <span class="text-xs text-green-600">(Add new)</span> }
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>

            <div class="flex flex-col w-full">
              <label class="py-2">
                <span class="font-semibold text-gray-700 text-sm">Brand</span>
              </label>
              <div class="relative">
                <input type="text" [ngModel]="selectedProduct.brandName" (ngModelChange)="onAutocompleteInput('brand', $event)" name="brandName" class="p-inputtext p-component w-full pr-14" placeholder="e.g. Dell" (focus)="filterSuggestions('brand', selectedProduct.brandName || '')" (blur)="hideSuggestionsDelayed('brand')" (keydown.enter)="onAutocompleteEnter('brand', $event)" autocomplete="off" />
                <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  @if (lookupsLoading) {
                    <i class="pi pi-spin pi-spinner text-gray-400"></i>
                  }
                  @if (selectedProduct.brandName) {
                    <button type="button" class="p-1 text-gray-400 hover:text-gray-600 rounded-full transition" (mousedown)="$event.preventDefault(); onAutocompleteInput('brand', '')">✕</button>
                  }
                </div>
                @if (showSuggestions['brand'] && (filteredSuggestions['brand']?.length ?? 0) > 0) {
                  <ul class="absolute z-50 w-full bg-gray-50 shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto" (mousedown)="cancelHideSuggestions()">
                    @for (suggestion of filteredSuggestions['brand']; track suggestion) {
                      <li (mousedown)="selectSuggestion('brand', suggestion)" class="p-2 hover:bg-gray-200 cursor-pointer">
                        {{ suggestion.name }} @if (suggestion.isNew) { <span class="text-xs text-green-600">(Add new)</span> }
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col w-full">
              <label class="py-2">
                <span class="font-semibold text-gray-700 text-sm">Department</span>
              </label>
              <div class="relative">
                <input type="text" [ngModel]="selectedProduct.departmentName" (ngModelChange)="onAutocompleteInput('department', $event)" name="departmentName" class="p-inputtext p-component w-full pr-14" placeholder="Select or type new department..." (focus)="filterSuggestions('department', selectedProduct.departmentName || '')" (blur)="hideSuggestionsDelayed('department')" (keydown.enter)="onAutocompleteEnter('department', $event)" autocomplete="off" />
                <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  @if (lookupsLoading) {
                    <i class="pi pi-spin pi-spinner text-gray-400"></i>
                  }
                  @if (selectedProduct.departmentName) {
                    <button type="button" class="p-1 text-gray-400 hover:text-gray-600 rounded-full transition" (mousedown)="$event.preventDefault(); onAutocompleteInput('department', '')">✕</button>
                  }
                </div>
                @if (showSuggestions['department'] && (filteredSuggestions['department']?.length ?? 0) > 0) {
                  <ul class="absolute z-50 w-full bg-gray-50 shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto" (mousedown)="cancelHideSuggestions()">
                    @for (suggestion of filteredSuggestions['department']; track suggestion) {
                      <li (mousedown)="selectSuggestion('department', suggestion)" class="p-2 hover:bg-gray-200 cursor-pointer">
                        {{ suggestion.name }} @if (suggestion.isNew) { <span class="text-xs text-green-600">(Add new)</span> }
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          </div>

          <div class="flex flex-col w-full">
            <label class="py-2">
              <span class="font-semibold text-gray-700 text-sm">Price <span class="text-red-500">*</span></span>
            </label>
            <input
              type="number"
              [(ngModel)]="selectedProduct.price"
              name="price"
              required
              placeholder="e.g. 1200.00"
              class="p-inputtext p-component w-full"
              step="0.01"
              min="0"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col w-full">
              <label class="py-2">
                <span class="font-semibold text-gray-700 text-sm">Quality</span>
              </label>
              <select
                [(ngModel)]="selectedProduct.qualityId"
                (ngModelChange)="onQualityChange($event)"
                name="quality"
                class="p-inputtext p-component w-full py-2"
              >
                <option value="">Select quality...</option>
              @for (q of qualities; track q.id) {
                <option [value]="q.id">{{ q.name }}</option>
              }
              </select>
            </div>
          </div>

          <!-- Vehicle Specific Fields (Only shows if Motorbike or Car) -->
          @if (isVehicleCategory) {
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
              <div class="flex flex-col w-full">
                <label class="py-2">
                  <span class="font-semibold text-gray-700 text-sm">Year</span>
                </label>
                <input
                  type="date"
                  [ngModel]="selectedProduct.year | date:'yyyy-MM-dd'"
                  (ngModelChange)="onYearChange($event)"
                  name="year"
                  class="p-inputtext p-component w-full bg-white"
                  [max]="todayString"
                />
              </div>
              <div class="flex flex-col w-full">
                <label class="py-2">
                  <span class="font-semibold text-gray-700 text-sm">Plate Number</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="selectedProduct.plateNumber"
                  name="plateNumber"
                  placeholder="e.g. 1A-1234"
                  class="p-inputtext p-component w-full bg-white"
                />
              </div>
              <div class="flex flex-col w-full">
                <label class="py-2">
                  <span class="font-semibold text-gray-700 text-sm">Engine / Serial Number</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="selectedProduct.engineNumber"
                  name="engineNumber"
                  placeholder="e.g. ENG-123456"
                  class="p-inputtext p-component w-full bg-white"
                />
              </div>
            </div>
          }

          <div class="flex flex-col w-full">
            <label class="py-2">
              <span class="font-semibold text-gray-700 text-sm">Description</span>
            </label>
            <textarea
              [(ngModel)]="selectedProduct.description"
              name="description"
              placeholder="Product description..."
              class="p-inputtext p-component w-full"
              rows="3"
            ></textarea>
          </div>

          <!-- Stock Acquisition -->
          @if (!isEditing || (selectedProduct.purchaseType && selectedProduct.purchaseType !== 'None')) {
            <div class="flex items-center text-sm font-semibold text-gray-400 my-4 before:flex-1 before:border-t before:border-gray-200 before:mr-4 after:flex-1 after:border-t after:border-gray-200 after:ml-4">{{ isEditing ? 'Purchase Information' : 'Initial Stock / Acquisition' }}</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/30 p-4 rounded-xl border border-gray-200">
                <div class="flex flex-col w-full" [class.opacity-70]="disablePurchaseFields">
                  <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Acquisition Type</span></label>
                  <select [(ngModel)]="selectedProduct.purchaseType" name="purchaseType" class="p-inputtext p-component w-full bg-white py-2" [disabled]="disablePurchaseFields">
                    <option [ngValue]="null">None (Just setup product catalog)</option>
                    <option value="Purchased">Purchased</option>
                    <option value="Donated">Donated</option>
                  </select>
                </div>
                
                @if (selectedProduct.purchaseType && selectedProduct.purchaseType !== 'None') {
                  <div class="flex flex-col w-full" [class.opacity-70]="disablePurchaseFields">
                    <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Initial Quantity <span class="text-red-500">*</span></span></label>
                    <input type="number" [(ngModel)]="selectedProduct.initialQuantity" name="initialQuantity" min="1" required class="p-inputtext p-component w-full bg-white" [disabled]="disablePurchaseFields" />
                  </div>
                  <div class="flex flex-col w-full">
                    <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Responsible Person</span></label>
                    <div class="relative">
                      <input type="text" [ngModel]="selectedProduct.responsiblePerson" (ngModelChange)="onAutocompleteInput('person', $event)" name="responsiblePerson" class="p-inputtext p-component w-full bg-white pr-14" placeholder="Select or type new person..." (focus)="filterSuggestions('person', selectedProduct.responsiblePerson || '')" (blur)="hideSuggestionsDelayed('person')" (keydown.enter)="onAutocompleteEnter('person', $event)" autocomplete="off" />
                      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        @if (lookupsLoading) {
                          <i class="pi pi-spin pi-spinner text-gray-400"></i>
                        }
                        @if (selectedProduct.responsiblePerson) {
                          <button type="button" class="p-1 text-gray-400 hover:text-gray-600 rounded-full transition" (mousedown)="$event.preventDefault(); onAutocompleteInput('person', '')">✕</button>
                        }
                      </div>
                      @if (showSuggestions['person'] && (filteredSuggestions['person']?.length ?? 0) > 0) {
                        <ul class="absolute z-50 w-full bg-gray-50 shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto" (mousedown)="cancelHideSuggestions()">
                          @for (suggestion of filteredSuggestions['person']; track suggestion) {
                            <li (mousedown)="selectSuggestion('person', suggestion)" class="p-2 hover:bg-gray-200 cursor-pointer">
                              {{ suggestion.fullName }} @if (suggestion.isNew) { <span class="text-xs text-green-600">(Add new)</span> }
                            </li>
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
                      <input type="text" [ngModel]="selectedProduct.supplierName" (ngModelChange)="onAutocompleteInput('supplier', $event)" name="supplierName" class="p-inputtext p-component w-full bg-white pr-14" placeholder="e.g. ABC Tech" (focus)="filterSuggestions('supplier', selectedProduct.supplierName || '')" (blur)="hideSuggestionsDelayed('supplier')" (keydown.enter)="onAutocompleteEnter('supplier', $event)" autocomplete="off" [disabled]="disablePurchaseFields" />
                      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        @if (lookupsLoading) {
                          <i class="pi pi-spin pi-spinner text-gray-400"></i>
                        }
                        @if (selectedProduct.supplierName) {
                          <button type="button" class="p-1 text-gray-400 hover:text-gray-600 rounded-full transition" (mousedown)="$event.preventDefault(); onAutocompleteInput('supplier', '')" [disabled]="disablePurchaseFields">✕</button>
                        }
                      </div>
                      @if (showSuggestions['supplier'] && (filteredSuggestions['supplier']?.length ?? 0) > 0) {
                        <ul class="absolute z-50 w-full bg-gray-50 shadow-lg rounded-lg mt-1 max-h-60 overflow-y-auto" (mousedown)="cancelHideSuggestions()">
                          @for (suggestion of filteredSuggestions['supplier']; track suggestion) {
                            <li (mousedown)="selectSuggestion('supplier', suggestion)" class="p-2 hover:bg-gray-200 cursor-pointer">
                              {{ suggestion.name }} @if (suggestion.isNew) { <span class="text-xs text-green-600">(Add new)</span> }
                            </li>
                          }
                        </ul>
                      }
                    </div>
                  </div>
                    <div class="flex flex-col w-full">
                    <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Voucher Number</span></label>
                      <input type="text" [(ngModel)]="selectedProduct.voucherNumber" name="voucherNumber" class="p-inputtext p-component w-full bg-white" placeholder="e.g. INV-12345" />
                  </div>
                }
                
                @if (selectedProduct.purchaseType === 'Donated') {
                  <div class="flex flex-col w-full" [class.opacity-70]="disablePurchaseFields">
                    <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Donor Name</span></label>
                    <input type="text" [(ngModel)]="selectedProduct.donorName" name="donorName" class="p-inputtext p-component w-full bg-white" [disabled]="disablePurchaseFields" placeholder="e.g. John Doe" />
                  </div>
                }
              </div>
          }

          <div class="flex justify-end gap-2 mt-6">
            <button type="button" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition" (click)="closeModal()">{{ isEditing ? 'Close' : 'Cancel' }}</button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="!isProductFormValid || !productForm.form.valid || imageLoading"
            >
              @if (imageLoading) {
                <i class="pi pi-spin pi-spinner text-sm"></i>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              }
              {{ isEditing ? 'Save Changes' : 'Create Product' }}
            </button>
          </div>
        </form>
    </p-dialog>

    <!-- View Product Modal -->
    <p-dialog header="Product Details" [(visible)]="isViewModalVisible" [modal]="true" [style]="{width: '100%', maxWidth: '800px'}">
        @if (viewProduct) {
          <div class="space-y-6 pt-2">
            <!-- Header -->
            <div class="flex items-start gap-6">
              @if (viewProduct.imageUrl) {
                <div class="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0">
                  <img [src]="viewProduct.imageUrl" [alt]="viewProduct.name" class="w-full h-full object-cover" />
                </div>
              } @else {
                <div class="w-32 h-32 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              }
              <div class="flex-1">
                <h3 class="font-bold text-3xl mb-2">{{ viewProduct.name }}</h3>
                <div class="flex flex-wrap gap-2">
                  @if (viewProduct.categoryName) {
                    <p-badge [value]="viewProduct.categoryName" severity="primary"></p-badge>
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
            <div class="border-t border-gray-200 my-4"></div>

            <!-- Product Details Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Item Name -->
              <div class="bg-gray-50/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Item Name</p>
                <p class="text-lg font-medium">{{ viewProduct.name || '-' }}</p>
              </div>

              <!-- Code Number -->
              <div class="bg-gray-50/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Code Number</p>
                <p class="text-lg font-medium">{{ viewProduct.codeNumber || '-' }}</p>
              </div>

              <!-- Brand -->
              <div class="bg-gray-50/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Brand</p>
                <p class="text-lg font-medium">{{ viewProduct.brandName || getLookupName(brands, viewProduct.brandId) || '-' }}</p>
              </div>

              <!-- Department -->
              <div class="bg-gray-50/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Department</p>
                <p class="text-lg font-medium">{{ viewProduct.departmentName || getLookupName(departments, viewProduct.departmentId) || '-' }}</p>
              </div>

              <!-- Price -->
              <div class="bg-gray-50/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Price</p>
                <p class="text-lg font-medium text-blue-600">{{ viewProduct.price ? '$' + (viewProduct.price | number:'1.2-2') : '-' }}</p>
              </div>

              <!-- Voucher Number -->
              <div class="bg-gray-50/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Voucher Number</p>
                <p class="text-lg font-medium">{{ viewProduct.voucherNumber || '-' }}</p>
              </div>

              <!-- Purchase Date -->
              <div class="bg-gray-50/50 rounded-lg p-4">
                <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Purchase Date</p>
                <p class="text-lg font-medium">{{ viewProduct.invoiceDate ? (viewProduct.invoiceDate | date:'shortDate') : (viewProduct.createdDate ? (viewProduct.createdDate | date:'shortDate') : '-') }}</p>
              </div>
            </div>
          </div>
          
          <ng-template pTemplate="footer">
            <div class="flex justify-end gap-2 w-full mt-4">
              <button type="button" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition" (click)="closeViewModal()">Close</button>
              <button type="button" class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition flex items-center gap-2" (click)="closeViewAndEdit()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Product
              </button>
            </div>
          </ng-template>
        }
    </p-dialog>

    <!-- Stock Transfer Modal -->
    <p-dialog header="Transfer Stock" [(visible)]="isTransferModalVisible" [modal]="true" [style]="{width: '100%', maxWidth: '500px'}">
        @if (productToTransfer) {
          <div class="space-y-4 pt-2">
                <div class="bg-gray-100 p-3 rounded-lg text-sm">
              <p><strong>Product:</strong> {{ productToTransfer.name }}</p>
              <p><strong>Current Dept:</strong> {{ productToTransfer.departmentName || getLookupName(departments, productToTransfer.departmentId) || 'None' }}</p>
            </div>

                <div class="flex flex-col w-full">
                  <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Target Department <span class="text-red-500">*</span></span></label>
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
                  <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Quantity to Transfer <span class="text-red-500">*</span></span></label>
                  <input type="number" [(ngModel)]="transferQuantity" min="1" class="p-inputtext p-component w-full" />
            </div>

                <div class="flex flex-col w-full">
                  <label class="py-2"><span class="font-semibold text-gray-700 text-sm">Transfer Notes</span></label>
                  <textarea [(ngModel)]="transferNotes" class="p-inputtext p-component w-full" placeholder="Reason for transfer..."></textarea>
            </div>

            <ng-template pTemplate="footer">
              <div class="flex justify-end gap-2 w-full mt-4">
                  <button type="button" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition" (click)="closeTransferModal()">Cancel</button>
              <button 
                type="button" 
                    class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2" 
                [disabled]="!transferTargetDepartmentId || transferQuantity < 1 || isTransferring"
                (click)="executeTransfer()"
              >
                    @if (isTransferring) { <i class="pi pi-spin pi-spinner text-sm"></i> }
                Confirm Transfer
              </button>
              </div>
            </ng-template>
          </div>
        }
    </p-dialog>

    <!-- Delete Confirmation Modal -->
    <p-dialog header="Confirm Deletion" [(visible)]="isDeleteModalVisible" [modal]="true" [style]="{width: '100%', maxWidth: '400px'}">
        @if (productToDelete) {
          <div class="flex flex-col items-center text-center pt-2">
            <div class="mb-4">
                  <div class="rounded-full p-4 bg-red-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>

                <p class="text-gray-500 mb-4">
                  Are you sure you want to <strong class="text-red-600">delete</strong> the product
              <span class="font-bold">{{ productToDelete.name }}</span>?
            </p>

                <div class="bg-yellow-50 text-yellow-800 p-4 mb-4 rounded-lg flex items-center gap-3 w-full text-left">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span class="text-sm">This action cannot be undone!</span>
            </div>

            <ng-template pTemplate="footer">
              <div class="flex w-full gap-3 mt-4">
                    <button class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition flex-1" type="button" (click)="closeDeleteModal()">
                  Cancel
                </button>
                <button
                      class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex-1 flex items-center justify-center gap-2"
                  type="button"
                  (click)="executeDelete()"
                >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Product
                </button>
              </div>
            </ng-template>
          </div>
        }
    </p-dialog>

    <!-- Bulk Delete Confirmation Modal -->
    <p-dialog header="Confirm Bulk Deletion" [(visible)]="isBulkDeleteModalVisible" [modal]="true" [style]="{width: '100%', maxWidth: '400px'}">
        <div class="flex flex-col items-center text-center pt-2">
          <div class="mb-4">
                <div class="rounded-full p-4 bg-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
              <p class="text-gray-500 mb-4">
                Are you sure you want to <strong class="text-red-600">delete {{ selectedProducts.size }} selected products</strong>?
          </p>
              <div class="bg-yellow-50 text-yellow-800 p-4 mb-4 rounded-lg flex items-center gap-3 w-full text-left">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span class="text-sm">This action cannot be undone!</span>
          </div>
          <ng-template pTemplate="footer">
            <div class="flex w-full gap-3 mt-4">
                  <button class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition flex-1" type="button" (click)="closeBulkDeleteModal()">Cancel</button>
              <button
                    class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex-1 flex items-center justify-center gap-2"
                type="button"
                (click)="executeBulkDelete()"
              >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete Selected
              </button>
            </div>
          </ng-template>
        </div>
    </p-dialog>

    <!-- Success/Error/Warning Message Modal -->
    <p-dialog [header]="messageTitle" [(visible)]="isMessageModalVisible" [modal]="true" [style]="{width: '100%', maxWidth: '400px'}">
        <div class="flex flex-col items-center text-center pt-2">
          <div class="mb-4">
                <div class="rounded-full p-4" [class]="messageType === 'success' ? 'bg-green-100' : messageType === 'warning' ? 'bg-yellow-100' : 'bg-red-100'">
              @if (messageType === 'success') {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              @if (messageType === 'warning') {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              @if (messageType === 'error') {
                    <svg xmlns="http://www.w3
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            </div>
          </div>

          <p class="text-base-content/70 mb-4">{{ messageContent }}</p>

          <ng-template pTemplate="footer">
            <div class="flex w-full mt-4">
              <button class="btn btn-ghost flex-1" type="button" (click)="closeMessageModal()">OK</button>
            </div>
          </ng-template>
        </div>
    </p-dialog>

    <!-- Import Errors Modal -->
    <p-dialog header="Import Completed with Errors" [visible]="importErrors.length > 0" (visibleChange)="importErrors = $event ? importErrors : []" [modal]="true" [style]="{width: '100%', maxWidth: '500px'}">
        <p class="text-base-content/70 mb-4 pt-2">Some rows failed validation. Please review the specific errors below:</p>
        <div class="overflow-y-auto max-h-60 bg-base-200 rounded-lg p-3">
          <ul class="list-disc list-inside px-4">
            @for (err of importErrors; track $index) {
              <li class="text-error text-sm py-1">{{ err }}</li>
            }
          </ul>
        </div>
        <ng-template pTemplate="footer">
          <div class="flex justify-end w-full mt-4">
            <button type="button" class="btn btn-primary" (click)="importErrors = []">Dismiss</button>
          </div>
        </ng-template>
    </p-dialog>
  `
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly api = inject(ProductApiService);
  private readonly categoryApi = inject(CategoryApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5001/api/inventory/products';

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
    if (!id) return null;
    return list.find(item => item.id === id)?.name || null;
  }

  protected toggleColumnVisibility(colId: string, event: Event): void {
    event.stopPropagation();
    if (this.visibleColumns.has(colId)) {
      this.visibleColumns.delete(colId);
    } else {
      this.visibleColumns.add(colId);
    }
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
  protected messageType: 'success' | 'error' | 'warning' = 'success';
  protected messageTitle = '';

  protected isFormModalVisible = false;
  protected isViewModalVisible = false;
  protected isTransferModalVisible = false;
  protected isDeleteModalVisible = false;
  protected isBulkDeleteModalVisible = false;
  protected isMessageModalVisible = false;

  // Transfer states
  protected productToTransfer: ExtendedProductDto | null = null;
  protected transferTargetDepartmentId = '';
  protected transferQuantity = 1;
  protected transferNotes = '';
  protected isTransferring = false;
  protected parsedContacts: { type: string, value: string }[] = [];
  protected messageContent = '';
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
      .withUrl('http://localhost:5001/hubs/import', {
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
      brands: this.http.get<BrandDto[]>('http://localhost:5001/api/Brand').pipe(catchError(() => of([]))),
      departments: this.http.get<DepartmentDto[]>('http://localhost:5001/api/Department').pipe(catchError(() => of([]))),
      persons: this.http.get<PersonDto[]>('http://localhost:5001/api/Person').pipe(catchError(() => of([]))),
      suppliers: this.http.get<SupplierDto[]>('http://localhost:5001/api/Supplier').pipe(catchError(() => of([]))),
      qualities: this.http.get<any[]>('http://localhost:5001/api/Quality').pipe(catchError(() => of([])))
    }).subscribe({
      next: (results: any) => {
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
      this.http.post<PersonDto>('http://localhost:5001/api/Person', { fullName: this.selectedProduct.responsiblePerson }).subscribe({
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

    this.http.post(`http://localhost:5001/api/inventory/products/${this.productToTransfer.id}/transfer`, payload).subscribe({
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
    this.productToDelete = product;
    this.isDeleteModalVisible = true;
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalVisible = false;
  }

  protected executeDelete(): void {
    if (!this.productToDelete?.id) return;

    this.http.delete(`${this.apiUrl}/${this.productToDelete.id}`).subscribe({
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

  protected confirmBulkDelete(): void {
    this.isBulkDeleteModalVisible = true;
  }

  protected closeBulkDeleteModal(): void {
    this.isBulkDeleteModalVisible = false;
  }

  protected executeBulkDelete(): void {
    if (this.selectedProducts.size === 0) return;

    const deleteRequests = Array.from(this.selectedProducts).map(id => this.http.delete(`${this.apiUrl}/${id}`));

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.showMessage('success', 'Bulk Delete Successful', `${this.selectedProducts.size} products have been deleted.`);
        this.loadProducts(); // This will also clear selections
        this.closeBulkDeleteModal();
      },
      error: (err) => {
        this.showMessage('error', 'Bulk Delete Failed', 'Some products could not be deleted. Please try again.');
        console.error('Error during bulk delete:', err);
        this.closeBulkDeleteModal();
      }
    });
  }

  protected showMessage(type: 'success' | 'error' | 'warning', title: string, content: string): void {
    this.messageType = type;
    this.messageTitle = title;
    this.messageContent = content;
    this.isMessageModalVisible = true;
  }

  protected closeMessageModal(): void {
    this.isMessageModalVisible = false;
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
      this.http.delete(`http://localhost:5001/api/inventory/products/${this.selectedProduct.id}/image`).subscribe({
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
      // 1. Read and clean the Excel file before sending it to the backend
      const workbook = new ExcelJS.Workbook();
      try {
        await workbook.xlsx.load(await file.arrayBuffer());
      } catch (parseErr) {
        this.showMessage('error', 'Invalid Format', 'Please upload a valid .xlsx file.');
        this.isImporting = false;
        this.cdr.detectChanges();
        return;
      }
      const worksheet = workbook.worksheets[0];

      if (worksheet) {
        // Iterate backwards so we can safely delete ghost rows without shifting indexes
        for (let i = worksheet.rowCount; i > 1; i--) {
          const row = worksheet.getRow(i);
          let isRowEmpty = true;

          row.eachCell({ includeEmpty: false }, (cell) => {
            if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
              isRowEmpty = false;
              if (typeof cell.value === 'string') {
                cell.value = cell.value.trim();
              }
            }
          });

          if (isRowEmpty) {
            worksheet.spliceRows(i, 1);
          }
        }
      }

      // 2. Generate a new cleaned File to send
      const cleanedBuffer = await workbook.xlsx.writeBuffer();
      const cleanedFile = new File([cleanedBuffer], file.name, { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // 3. Send the clean file to the API via HttpClient directly (bypassing native fetch)
      const formData = new FormData();
      formData.append('file', cleanedFile);

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

      this.http.post<{ imageUrl: string }>(`http://localhost:5001/api/inventory/products/${productId}/image`, formData).subscribe({
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
    this.http.delete(`http://localhost:5001/api/inventory/products/${productId}/image`).subscribe({
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
