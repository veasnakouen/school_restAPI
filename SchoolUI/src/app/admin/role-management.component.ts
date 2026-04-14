import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { RoleService } from './role.service';
import { Role } from './role.model';
import { PermissionService } from './permission.service';
import { Permission } from './permission.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss']
})
export class RoleManagementComponent implements OnInit {
      // Pagination properties
      page = 1;
      pageSize = 5;

      get pagedRoles() {
        const start = (this.page - 1) * this.pageSize;
        return this.roles.slice(start, start + this.pageSize);
      }

      get totalPages() {
        return Math.ceil(this.roles.length / this.pageSize);
      }

      setPage(newPage: number) {
        if (newPage >= 1 && newPage <= this.totalPages) {
          this.page = newPage;
        }
      }
    // Autocomplete + chips state for permissions
    permissionInput = '';
    filteredPermissionSuggestions: { name: string }[] = [];
    // Filter suggestions based on input and already selected permissions
    filterPermissionSuggestions() {
      const input = this.permissionInput.toLowerCase();
      this.filteredPermissionSuggestions = this.permissionsList
        .filter(p =>
          p.name.toLowerCase().includes(input) &&
          !(this.selectedRole?.permissions.includes(p.name))
        );
    }

    // Add a permission chip from input (if valid)
    addPermissionChip() {
      if (!this.permissionInput) return;
      const match = this.permissionsList.find(p => p.name.toLowerCase() === this.permissionInput.toLowerCase());
      if (match && this.selectedRole && !this.selectedRole.permissions.includes(match.name)) {
        this.selectedRole.permissions.push(match.name);
        this.permissionInput = '';
        this.filteredPermissionSuggestions = [];
        this.cdr.detectChanges();
      }
    }

    // Add a permission chip from suggestion click
    selectPermissionSuggestion(name: string) {
      if (this.selectedRole && !this.selectedRole.permissions.includes(name)) {
        this.selectedRole.permissions.push(name);
        this.permissionInput = '';
        this.filteredPermissionSuggestions = [];
        this.cdr.detectChanges();
      }
    }

    // Remove a permission chip
    removePermissionChip(name: string) {
      if (this.selectedRole) {
        this.selectedRole.permissions = this.selectedRole.permissions.filter(p => p !== name);
        this.cdr.detectChanges();
      }
    }
  private readonly cdr = inject(ChangeDetectorRef);
  roles: Role[] = [];
  selectedRole: Role | null = null;
  isEditing = false;
  isCreating = false;
  permissionsList: Permission[] = [];

  // Delete modal properties
  deleteItemName = '';
  deleteItemId: string | null = null;
  deletingInProgress = false;
  
  // Track original role data for comparison
  originalPermissions: string[] = [];
  originalRoleName = '';

  constructor(private roleService: RoleService, private permissionService: PermissionService) {}

  ngOnInit(): void {
    this.loadRoles();
    this.permissionService.getPermissions().subscribe(perms => {
      this.permissionsList = perms;
      this.cdr.detectChanges();
    });
  }

  // Removed permissionsString getter/setter (now using multi-select)

  loadRoles() {
    this.roleService.getRoles().subscribe(roles => {
      this.roles = roles;
      this.cdr.detectChanges();
    });
  }

  startCreate() {
    this.selectedRole = { id: '', name: '', permissions: [] };
    this.isCreating = true;
    this.isEditing = false;
    this.permissionInput = '';
    this.filteredPermissionSuggestions = [];
    this.cdr.detectChanges();
    setTimeout(() => {
      const modal = document.getElementById('role-form-modal') as HTMLDialogElement;
      if (modal) modal.showModal();
    });
  }

  startEdit(role: Role) {
    console.log('Editing role - original data:', role);
    console.log('Role permissions:', role.permissions);
    
    // If permissions are not loaded, fetch them
    if (!role.permissions || role.permissions.length === 0) {
      console.log('Fetching permissions for role:', role.name);
      this.roleService.getRolePermissions(role.name).subscribe({
        next: (permissions) => {
          console.log('Fetched permissions:', permissions);
          this.selectedRole = { 
            ...role, 
            permissions: [...permissions] 
          };
          this.originalPermissions = [...permissions]; // Store original permissions
          this.originalRoleName = role.name; // Store original role name
          this.isEditing = true;
          this.isCreating = false;
          this.permissionInput = '';
          this.filteredPermissionSuggestions = [];
          
          console.log('Selected role for edit:', this.selectedRole);
          console.log('Selected role permissions:', this.selectedRole?.permissions);
          console.log('Original permissions:', this.originalPermissions);
          console.log('Original role name:', this.originalRoleName);
          
          this.cdr.detectChanges();
          setTimeout(() => {
            const modal = document.getElementById('role-form-modal') as HTMLDialogElement;
            if (modal) modal.showModal();
          });
        },
        error: (error) => {
          console.error('Error fetching role permissions:', error);
          // Still open modal with empty permissions
          this.selectedRole = { ...role, permissions: [] };
          this.originalPermissions = [];
          this.originalRoleName = role.name;
          this.isEditing = true;
          this.isCreating = false;
          this.cdr.detectChanges();
          setTimeout(() => {
            const modal = document.getElementById('role-form-modal') as HTMLDialogElement;
            if (modal) modal.showModal();
          });
        }
      });
    } else {
      this.selectedRole = { 
        ...role, 
        permissions: [...role.permissions] 
      };
      this.originalPermissions = [...role.permissions]; // Store original permissions
      this.originalRoleName = role.name; // Store original role name
      
      console.log('Selected role for edit:', this.selectedRole);
      console.log('Selected role permissions:', this.selectedRole?.permissions);
      console.log('Original permissions:', this.originalPermissions);
      console.log('Original role name:', this.originalRoleName);
      
      this.isEditing = true;
      this.isCreating = false;
      this.permissionInput = '';
      this.filteredPermissionSuggestions = [];
      
      this.cdr.detectChanges();
      setTimeout(() => {
        const modal = document.getElementById('role-form-modal') as HTMLDialogElement;
        if (modal) modal.showModal();
      });
    }
  }

  cancel() {
    const modal = document.getElementById('role-form-modal') as HTMLDialogElement;
    if (modal) modal.close();
    this.selectedRole = null;
    this.isEditing = false;
    this.isCreating = false;
  }

  onBackdropClick(event: MouseEvent) {
    // Close modal only if clicking directly on the dialog (backdrop), not on the modal-box
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  saveRole() {
    if (!this.selectedRole) return;
    
    console.log('Saving role:', this.selectedRole);
    console.log('Original permissions:', this.originalPermissions);
    console.log('New permissions:', this.selectedRole.permissions);
    
    if (this.isCreating) {
      // Create new role with permissions
      this.roleService.createRole(this.selectedRole).subscribe({
        next: () => {
          console.log('Role created successfully');
          this.loadRoles();
          this.cancel();
        },
        error: (error) => {
          console.error('Error creating role:', error);
          alert('Failed to create role. Please try again.');
          this.loadRoles();
          this.cancel();
        }
      });
    } else if (this.isEditing) {
      if (!this.selectedRole || !this.selectedRole.permissions) return;
      
      const currentRole = this.selectedRole;
      const currentPermissions = currentRole.permissions;

      // Calculate permission changes
      const permissionsToAdd = currentPermissions.filter(perm => !this.originalPermissions.includes(perm));
      const permissionsToRemove = this.originalPermissions.filter(perm => !currentPermissions.includes(perm));

      console.log('Permissions to add:', permissionsToAdd);
      console.log('Permissions to remove:', permissionsToRemove);

      // First, update the role name if it changed
      const updateRoleName = currentRole.name !== this.originalRoleName;

      const saveAndSyncPermissions = () => {
        // Now sync permissions
        const permissionOperations = [
          ...permissionsToRemove.map(perm => this.roleService.removePermissionFromRole(currentRole.name, perm)),
          ...permissionsToAdd.map(perm => this.roleService.addPermissionToRole(currentRole.name, perm))
        ];

        if (permissionOperations.length === 0) {
          console.log('No permission changes to save');
          this.loadRoles();
          this.cancel();
          return;
        }

        forkJoin(permissionOperations).subscribe({
          next: () => {
            console.log('Role permissions updated successfully');
            console.log(`Added ${permissionsToAdd.length} permissions, removed ${permissionsToRemove.length} permissions`);
            this.loadRoles();
            this.cancel();
          },
          error: (error) => {
            console.error('Error updating role permissions:', error);
            alert('Failed to update role permissions. Please try again.');
            this.loadRoles();
            this.cancel();
          }
        });
      };

      if (updateRoleName) {
        this.roleService.updateRole({
          id: currentRole.id,
          name: currentRole.name,
          permissions: currentPermissions
        }).subscribe({
          next: () => {
            console.log('Role name updated');
            saveAndSyncPermissions();
          },
          error: (error) => {
            console.error('Error updating role name:', error);
            alert('Failed to update role. Please try again.');
            this.loadRoles();
            this.cancel();
          }
        });
      } else {
        saveAndSyncPermissions();
      }
    }
  }

  openDeleteModal(role: Role) {
    this.deleteItemId = role.id;
    this.deleteItemName = role.name;
    const modal = document.getElementById('role-delete-modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  }

  closeDeleteModal() {
    const modal = document.getElementById('role-delete-modal') as HTMLDialogElement;
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
    
    this.roleService.deleteRole(this.deleteItemId).subscribe({
      next: () => {
        this.loadRoles();
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Failed to delete role:', error);
        this.deletingInProgress = false;
        this.cdr.detectChanges();
      }
    });
  }
}
