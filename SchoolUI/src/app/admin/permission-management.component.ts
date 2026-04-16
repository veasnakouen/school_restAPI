import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { PermissionService } from './permission.service';
import { Permission } from './permission.model';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-permission-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permission-management.component.html',
  styleUrls: ['./permission-management.component.scss']
})
export class PermissionManagementComponent implements OnInit {
    saveError: string | null = null;
  private readonly cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  permissions: Permission[] = [];
  selectedPermission: Permission | null = null;
  isEditing = false;
  isCreating = false;
  resourceOptions: string[] = [
    'User', 'Role', 'Product', 'Category', 'Brand', 'Report', 'Student', 'Class',
    'enrollment', 'users', 'roles', 'permissions'
  ];
  actionSelections = { add: false, edit: false, view: false, delete: false };

  // Delete modal properties
  deleteItemName = '';
  deleteItemId: string | null = null;
  deletingInProgress = false;

  constructor(private permissionService: PermissionService) {}

  // Pagination properties
  currentPage = 1;
  pageSize = 5;
  totalItems = 0;
  pageSizeOptions = [5, 10, 20, 50];

  get pagedPermissions() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.permissions.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  get startIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goToFirstPage() {
    this.currentPage = 1;
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions() {
    this.isLoading = true;
    this.permissionService.getPermissions().pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.isLoading = false; this.cdr.detectChanges(); })
    ).subscribe(perms => {
      this.permissions = perms;
      this.totalItems = this.permissions.length;
      this.currentPage = 1;
      this.cdr.detectChanges();
    });
  }

  startCreate() {
    this.selectedPermission = { id: '', name: '', description: '', resource: '', action: '' };
    this.isCreating = true;
    this.isEditing = false;
    this.actionSelections = { add: false, edit: false, view: false, delete: false };
    this.cdr.detectChanges();
    setTimeout(() => {
      const modal = document.getElementById('permission-form-modal') as HTMLDialogElement;
      if (modal) modal.showModal();
    });
  }

  startEdit(permission: Permission) {
    console.log('Edit permission:', permission); // Debug: see what's coming in
    
    this.selectedPermission = { ...permission };
    this.isEditing = true;
    this.isCreating = false;
    
    // Parse the name to extract resource and action if resource is not set or empty
    if ((!this.selectedPermission.resource || this.selectedPermission.resource.trim() === '') && this.selectedPermission.name) {
      const parts = this.selectedPermission.name.split('.');
      if (parts.length === 2) {
        const resource = parts[0];
        const action = parts[1];
        this.selectedPermission.resource = resource;
        this.selectedPermission.action = action;
        console.log('Parsed resource:', resource, 'action:', action);
      }
    }
    
    // Set action selections based on the parsed or existing action
    this.actionSelections = {
      add: this.selectedPermission.action === 'add' || this.selectedPermission.action === 'create',
      edit: this.selectedPermission.action === 'edit' || this.selectedPermission.action === 'update',
      view: this.selectedPermission.action === 'view' || this.selectedPermission.action === 'read',
      delete: this.selectedPermission.action === 'delete',
    };
    
    console.log('Action selections:', this.actionSelections);
    console.log('Selected permission:', this.selectedPermission);
    
    this.cdr.detectChanges();
    setTimeout(() => {
      const modal = document.getElementById('permission-form-modal') as HTMLDialogElement;
      if (modal) modal.showModal();
    });
  }

  cancel() {
    const modal = document.getElementById('permission-form-modal') as HTMLDialogElement;
    if (modal) modal.close();
    this.selectedPermission = null;
    this.isEditing = false;
    this.isCreating = false;
  }

  onBackdropClick(event: MouseEvent) {
    // Close modal only if clicking directly on the dialog (backdrop), not on the modal-box
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  savePermission() {
    if (!this.selectedPermission) return;
    const actions = Object.entries(this.actionSelections)
      .filter(([_, checked]) => checked)
      .map(([action]) => action);
    if (actions.length === 0) return;

    // For demo: create/update one permission per action
    const permsToSave = actions.map(action => ({
      ...this.selectedPermission!,
      action,
      name: `${this.selectedPermission!.resource}:${action}`
    }));

    if (this.isCreating) {
      // Save all new permissions in parallel, then reload
      this.saveError = null;
      this.isSaving = true;
      forkJoin(permsToSave.map(perm => {
        console.log('Saving permission:', perm);
        return this.permissionService.createPermission(perm);
      })).pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; this.cdr.detectChanges(); })
      ).subscribe({
        next: () => {
          this.loadPermissions();
          this.cancel();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Save permission error:', err);
          this.saveError = 'Failed to save permission(s): ' + (err?.message || err?.statusText || err);
          this.cdr.detectChanges();
        }
      });
    } else if (this.isEditing) {
      // Only update the current action
      this.saveError = null;
      this.isSaving = true;
      console.log('Updating permission:', permsToSave[0]);
      this.permissionService.updatePermission(permsToSave[0]).pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; this.cdr.detectChanges(); })
      ).subscribe({
        next: () => {
          this.loadPermissions();
          this.cancel();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Update permission error:', err);
          this.saveError = 'Failed to update permission: ' + (err?.message || err?.statusText || err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  openDeleteModal(permission: Permission) {
    this.deleteItemId = permission.id;
    this.deleteItemName = permission.name;
    const modal = document.getElementById('permission-delete-modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  closeDeleteModal() {
    const modal = document.getElementById('permission-delete-modal') as HTMLDialogElement;
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
    this.permissionService.deletePermission(this.deleteItemId).pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.deletingInProgress = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        this.loadPermissions();
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Failed to delete permission:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
