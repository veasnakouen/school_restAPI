import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { PermissionService } from './permission.service';
import { Permission } from './permission.model';
import { forkJoin } from 'rxjs';
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
  page = 1;
  pageSize = 5;

  get pagedPermissions() {
    const start = (this.page - 1) * this.pageSize;
    return this.permissions.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.permissions.length / this.pageSize);
  }

  setPage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
    }
  }

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions() {
    this.permissionService.getPermissions().subscribe(perms => {
      this.permissions = perms;
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
      forkJoin(permsToSave.map(perm => {
        console.log('Saving permission:', perm);
        return this.permissionService.createPermission(perm);
      })).subscribe({
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
      console.log('Updating permission:', permsToSave[0]);
      this.permissionService.updatePermission(permsToSave[0]).subscribe({
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
    
    this.permissionService.deletePermission(this.deleteItemId).subscribe({
      next: () => {
        this.loadPermissions();
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Failed to delete permission:', error);
        this.deletingInProgress = false;
        this.cdr.detectChanges();
      }
    });
  }
}
