import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AvatarComponent } from '../shared/avatar/avatar.component';
// import { ProductService } from './product.service'; // Ensure you have this service created

const TEMPLATE = `
<div class="pt-0 px-3 pb-3 max-w-7xl mx-auto">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
    <div>
      <h2 class="text-2xl font-bold text-base-content">Products</h2>
      <p class="text-base-content/60 text-sm mt-0.5">Manage your inventory items.</p>
    </div>
    <div class="flex gap-2">
      <p-button label="Export" icon="pi pi-download" [outlined]="true" (onClick)="exportMenu.toggle($event)"></p-button>
      <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
      <p-button label="Add Product" icon="pi pi-plus" (onClick)="openModal('create')"></p-button>
    </div>
  </div>

  <!-- Data Container -->
  <div class="bg-base-100 shadow-sm border border-base-300 rounded-lg my-3 overflow-hidden">
    
    <!-- Toolbar -->
    <div class="p-4 border-b border-base-300 bg-base-200 flex gap-4 items-center justify-between flex-wrap">
      <span class="relative w-full sm:w-72">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>
        <input pInputText type="text" [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" placeholder="Search by name or code..." class="w-full pl-10 p-inputtext-sm" />
      </span>
      
      <div class="flex gap-2 items-center">
        <p-button *ngIf="searchQuery" label="Clear" [text]="true" (onClick)="searchQuery = ''; applyFilters()"></p-button>
        
        <div class="flex border border-base-300 rounded-md overflow-hidden bg-base-100">
          <button class="px-3 py-1.5 hover:bg-base-200 transition-colors" [class.bg-primary]="viewMode === 'list'" [class.text-primary-content]="viewMode === 'list'" (click)="viewMode = 'list'">
            <i class="pi pi-list"></i>
          </button>
          <button class="px-3 py-1.5 hover:bg-base-200 transition-colors border-l border-base-300" [class.bg-primary]="viewMode === 'grid'" [class.text-primary-content]="viewMode === 'grid'" (click)="viewMode = 'grid'">
            <i class="pi pi-th-large"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <p-table *ngIf="viewMode === 'list'" [value]="filteredProducts" [loading]="isLoading" [paginator]="true" [rows]="pageSize" [rowsPerPageOptions]="[5, 10, 25, 50]" styleClass="p-datatable-striped p-datatable-sm" [tableStyle]="{'min-width': '50rem'}">
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="name">Product <p-sortIcon field="name"></p-sortIcon></th>
          <th pSortableColumn="codeNumber">Code <p-sortIcon field="codeNumber"></p-sortIcon></th>
          <th pSortableColumn="categoryName">Category <p-sortIcon field="categoryName"></p-sortIcon></th>
          <th pSortableColumn="price" class="text-right">Price <p-sortIcon field="price"></p-sortIcon></th>
          <th pSortableColumn="quality" class="text-center">Condition <p-sortIcon field="quality"></p-sortIcon></th>
          <th class="text-center">Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-product>
        <tr>
          <td>
            <div class="flex items-center gap-3">
              <app-avatar [src]="product.imageUrl" [initials]="product.name.charAt(0)" size="sm" shape="rounded"></app-avatar>
              <span class="font-bold text-base-content">{{product.name}}</span>
            </div>
          </td>
          <td><span class="font-mono text-sm bg-base-200 px-2 py-1 rounded">{{product.codeNumber || 'N/A'}}</span></td>
          <td>{{product.categoryName || '-'}}</td>
          <td class="text-right font-semibold text-primary">\${{product.price | number:'1.2-2'}}</td>
          <td class="text-center">
            <p-badge [value]="product.quality || 'N/A'" [severity]="getQualitySeverity(product.quality)"></p-badge>
          </td>
          <td class="text-center">
            <p-button icon="pi pi-ellipsis-v" [text]="true" [rounded]="true" severity="secondary" (onClick)="activeProduct = product; actionMenu.toggle($event)"></p-button>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="6" class="text-center py-8 text-base-content/50">No products found.</td>
        </tr>
      </ng-template>
    </p-table>

    <!-- Grid View -->
    <div *ngIf="viewMode === 'grid'" class="p-4 bg-base-200 min-h-[500px]">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div *ngFor="let product of filteredProducts" class="bg-base-100 border border-base-300 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group">
          <div class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <p-button icon="pi pi-ellipsis-v" [rounded]="true" severity="secondary" size="small" [style]="{width: '2rem', height: '2rem'}" (onClick)="activeProduct = product; actionMenu.toggle($event)"></p-button>
          </div>
          <div class="h-40 bg-base-200 flex items-center justify-center border-b border-base-300">
            <img *ngIf="product.imageUrl" [src]="product.imageUrl" class="object-cover w-full h-full" />
            <i *ngIf="!product.imageUrl" class="pi pi-image text-5xl text-base-content/20"></i>
          </div>
          <div class="p-3 flex-grow flex flex-col">
            <h3 class="font-bold text-lg truncate" [title]="product.name">{{product.name}}</h3>
            <p class="text-sm font-mono text-base-content/60 mb-2">{{product.codeNumber || 'No Code'}}</p>
            <div class="mt-auto flex justify-between items-center pt-2">
              <span class="text-primary font-bold text-lg">\${{product.price | number:'1.2-2'}}</span>
              <p-badge *ngIf="product.quality" [value]="product.quality" [severity]="getQualitySeverity(product.quality)"></p-badge>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="filteredProducts.length === 0" class="text-center py-12 text-base-content/50">No products found.</div>
    </div>
  </div>

  <!-- Shared Action Menu -->
  <p-menu #actionMenu [model]="actionMenuItems" [popup]="true"></p-menu>

  <!-- Create / Edit Modal -->
  <p-dialog [header]="modalMode === 'create' ? 'Create New Product' : 'Edit Product'" [(visible)]="showModal" [modal]="true" [style]="{width: '100%', maxWidth: '800px'}" (onHide)="closeModal()">
    <form *ngIf="selectedProduct" (ngSubmit)="saveProduct()" #productForm="ngForm" class="pt-2">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1 md:col-span-2">
          <label class="font-semibold text-sm">Product Name *</label>
          <input pInputText type="text" [(ngModel)]="selectedProduct.name" name="name" required class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-sm">Code Number</label>
          <input pInputText type="text" [(ngModel)]="selectedProduct.codeNumber" name="codeNumber" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-sm">Price *</label>
          <p-inputNumber [(ngModel)]="selectedProduct.price" name="price" mode="currency" currency="USD" locale="en-US" class="w-full" styleClass="w-full" required></p-inputNumber>
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-sm">Category</label>
          <input pInputText type="text" [(ngModel)]="selectedProduct.categoryName" name="categoryName" class="w-full" placeholder="e.g. Electronics" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-sm">Condition</label>
          <input pInputText type="text" [(ngModel)]="selectedProduct.quality" name="quality" class="w-full" placeholder="e.g. Brand New" />
        </div>
        <div class="flex flex-col gap-1 md:col-span-2">
          <label class="font-semibold text-sm">Description</label>
          <textarea pInputTextarea rows="3" [(ngModel)]="selectedProduct.description" name="description" class="w-full"></textarea>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-base-300">
        <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="closeModal()"></p-button>
        <p-button label="Save Product" type="submit" icon="pi pi-check" [disabled]="!productForm.valid || isSaving" [loading]="isSaving"></p-button>
      </div>
    </form>
  </p-dialog>
  
  <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>
  <p-toast></p-toast>
</div>
`;

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, MenuModule, BadgeModule, ConfirmDialogModule, ToastModule, InputNumberModule, InputTextareaModule, AvatarComponent],
  template: TEMPLATE,
  providers: [ConfirmationService, MessageService]
})
export class ProductsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  products: any[] = [];
  filteredProducts: any[] = [];
  
  isLoading = false;
  isSaving = false;
  viewMode: 'list' | 'grid' = 'list';
  searchQuery = '';
  pageSize = 10;

  showModal = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';
  selectedProduct: any = null;
  activeProduct: any = null; // Product targeted by the action menu

  actionMenuItems: MenuItem[] = [];
  exportMenuItems: MenuItem[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    // private productService: ProductService // Inject your service here
  ) {}

  ngOnInit() {
    this.setupMenus();
    this.loadProducts();
  }

  setupMenus() {
    this.actionMenuItems = [
      { label: 'View Details', icon: 'pi pi-eye', command: () => this.openModal('view', this.activeProduct) },
      { label: 'Transfer Dept', icon: 'pi pi-arrow-right-arrow-left', command: () => this.transferProduct(this.activeProduct) },
      { separator: true },
      { label: 'Edit Product', icon: 'pi pi-pencil', command: () => this.openModal('edit', this.activeProduct) },
      { label: 'Delete Product', icon: 'pi pi-trash', styleClass: 'text-red-500', command: () => this.deleteProduct(this.activeProduct) }
    ];

    this.exportMenuItems = [
      { label: 'Export as Excel', icon: 'pi pi-file-excel', command: () => this.exportData('excel') },
      { label: 'Export as CSV', icon: 'pi pi-file', command: () => this.exportData('csv') },
      { label: 'Export as PDF', icon: 'pi pi-file-pdf', command: () => this.exportData('pdf') }
    ];
  }

  loadProducts() {
    this.isLoading = true;
    // MOCK API CALL - Replace with: this.productService.getProducts({...}).subscribe(...)
    setTimeout(() => {
      this.products = [
        { id: '1', name: 'MacBook Pro 16', codeNumber: 'MBP-16-M3', price: 2499.00, categoryName: 'Electronics', quality: 'Brand New' },
        { id: '2', name: 'Aeron Office Chair', codeNumber: 'HM-AERON', price: 1250.00, categoryName: 'Furniture', quality: 'Fair' },
        { id: '3', name: 'Canon DSLR Camera', codeNumber: 'CAM-8821', price: 899.99, categoryName: 'Electronics', quality: 'Broken' }
      ];
      this.applyFilters();
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 500);
  }

  applyFilters() {
    let filtered = [...this.products];
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(q) || p.codeNumber?.toLowerCase().includes(q)
      );
    }
    this.filteredProducts = filtered;
  }

  openModal(mode: 'create' | 'edit' | 'view', product?: any) {
    this.modalMode = mode;
    this.selectedProduct = product ? { ...product } : { name: '', price: null, codeNumber: '', categoryName: '', description: '' };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedProduct = null;
  }

  saveProduct() {
    this.isSaving = true;
    // MOCK API CALL
    setTimeout(() => {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Product saved successfully.' });
      this.closeModal();
      this.isSaving = false;
      this.loadProducts();
    }, 800);
  }

  deleteProduct(product: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${product.name}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Product removed.' });
        this.loadProducts();
      }
    });
  }

  transferProduct(product: any) {
    this.messageService.add({ severity: 'info', summary: 'Transfer', detail: `Transfer dialog opened for ${product.name}` });
  }

  exportData(format: string) {
    this.messageService.add({ severity: 'info', summary: 'Export', detail: `Exporting data as ${format.toUpperCase()}...` });
  }

  getQualitySeverity(quality: string): string {
    if (!quality) return 'info';
    const q = quality.toLowerCase();
    if (q.includes('poor') || q.includes('broken')) return 'danger';
    if (q.includes('fair') || q.includes('okay')) return 'warning';
    if (q.includes('new') || q.includes('excellent')) return 'success';
    return 'info';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}