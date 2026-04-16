import { Component, ChangeDetectorRef, ElementRef, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { RoleService } from './role.service';
import { Role } from './role.model';
import { PermissionService } from './permission.service';
import { Permission } from './permission.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
<div class="pt-0 px-3 pb-3 max-w-5xl mx-auto">
  <div class="flex items-center justify-between mb-2">
    <h2 class="text-xl font-semibold flex items-center gap-2"><span class="text-primary">🛡️</span> Role Management</h2>
    <button class="btn btn-primary btn-sm gap-2" (click)="startCreate()" [disabled]="isSaving" title="Add Role">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span class="hidden sm:inline">Add Role</span>
    </button>
  </div>

  <div class="card bg-base-100 shadow-xl">
    <div class="p-0 md:p-2">
      <div *ngIf="roles.length > 0">
        <div class="hidden md:flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-600">
          <div class="w-1/3">Name</div>
          <div class="w-1/3">Permissions</div>
          <div class="w-1/6 text-right">Actions</div>
        </div>

        <div class="space-y-1 mt-0.5">
          <div *ngFor="let role of pagedRoles" class="bg-base-100 border border-base-200 rounded-md shadow-sm p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div class="flex items-center gap-2 w-full md:w-1/3">
              <app-avatar [src]="role.imageUrl" [initials]="role.name.charAt(0) || '?'" alt="{{role.name}}" size="sm"></app-avatar>
              <div>
                <div class="font-medium text-sm">{{ role.name }}</div>
                <div class="text-xs text-base-content/60 hidden md:block">ID: {{ role.id }}</div>
              </div>
            </div>

            <details class="md:hidden w-full mt-2">
              <summary class="cursor-pointer text-sm text-base-content/70">Permissions ({{ role.permissions.length || 0 }})</summary>
              <div class="mt-2 flex flex-wrap gap-2">
                <span class="badge badge-info" *ngFor="let perm of (role.permissions || [])">{{ perm }}</span>
                <span *ngIf="!role.permissions.length" class="text-sm text-base-content/60">No permissions</span>
              </div>
            </details>

            <div class="hidden md:block w-full md:w-1/3">
              <div class="flex flex-wrap gap-2">
                <span class="badge badge-info" *ngFor="let perm of (role.permissions || [])">{{ perm }}</span>
                <span *ngIf="!role.permissions.length" class="text-sm text-base-content/60">No permissions</span>
              </div>
            </div>

            <div class="w-full md:w-1/6 flex items-center justify-end gap-2">
              <button class="btn btn-ghost btn-square" aria-label="Edit role" title="Edit" (click)="startEdit(role)" [disabled]="isSaving || isDeleting">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3L12 14H9v-3z" />
                </svg>
              </button>
              <button class="btn btn-error btn-square" aria-label="Delete role" title="Delete" (click)="openDeleteModal(role)" [disabled]="isSaving || isDeleting">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center text-gray-400 py-4" *ngIf="roles.length === 0">No roles found.</div>

      <div class="px-3 py-3 border-t border-base-200" *ngIf="roles.length > 0">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2 flex-1 sm:flex-initial">
            <span class="text-sm opacity-70">Rows per page:</span>
            <select
              class="select select-bordered select-sm"
              [(ngModel)]="pageSize"
              (ngModelChange)="onPageSizeChange()"
            >
              <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
            </select>
          </div>

          <div class="text-sm opacity-70 text-center">
            Showing {{ startIndex }}-{{ endIndex }} of {{ totalItems }} roles
          </div>

          <div class="join bg-base-200 flex-1 sm:flex-initial sm:justify-end" *ngIf="totalItems > pageSize">
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

            <button
              type="button"
              *ngFor="let page of pages"
              class="join-item btn btn-sm"
              [class.btn-active]="page === currentPage"
              (click)="goToPage(page)"
            >
              {{ page }}
            </button>

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
    </div>
  </div>

  <dialog #roleFormModal id="role-form-modal" class="modal modal-bottom sm:modal-middle" (click)="onBackdropClick($event)">
    <div class="modal-box relative overflow-visible">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" (click)="cancel()" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <h3 class="font-bold text-lg mb-3">{{ isCreating ? 'Create Role' : 'Edit Role' }}</h3>
      <form (ngSubmit)="saveRole()" #roleForm="ngForm" class="space-y-3" *ngIf="selectedRole">
        <div class="form-control mb-3">
          <label class="label">
            <span class="label-text">Name</span>
          </label>
          <input [(ngModel)]="selectedRole.name" name="name" required class="input input-bordered w-full" />
        </div>
        <div class="form-control mb-3">
          <label class="label">
            <span class="label-text">Permissions</span>
          </label>
          <div class="relative overflow-visible">
            <div class="max-h-32 overflow-y-auto pr-1 mb-2">
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let perm of selectedRole.permissions" class="badge badge-info gap-1 items-center">
                  {{ perm }}
                  <button type="button" class="btn btn-xs btn-circle btn-ghost ml-1" (click)="removePermissionChip(perm)" aria-label="Remove permission">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </div>
            </div>
            <input
              type="text"
              [(ngModel)]="permissionInput"
              name="permissionInput"
              autocomplete="off"
              (focus)="showPermissionSuggestionList()"
              (input)="filterPermissionSuggestions()"
              (keydown.enter)="onPermissionInputEnter($event)"
              (keydown.escape)="hidePermissionSuggestions()"
              (blur)="hidePermissionSuggestionsDelayed()"
              class="input input-bordered w-full"
              placeholder="Type to search permissions..."
            />
            <ul *ngIf="showPermissionSuggestions && filteredPermissionSuggestions.length > 0" class="absolute left-0 right-0 top-full mt-1 z-[9999] bg-base-100 rounded shadow-lg border border-base-200 max-h-48 overflow-y-auto">
              <li *ngFor="let suggestion of filteredPermissionSuggestions" (mousedown)="selectPermissionSuggestion(suggestion.name, $event)" class="px-3 py-2 cursor-pointer hover:bg-base-200">
                {{ suggestion.name }}
              </li>
            </ul>
            <p *ngIf="showPermissionSuggestions && filteredPermissionSuggestions.length === 0 && permissionInput" class="mt-2 text-xs text-base-content/60">
              No matching permissions.
            </p>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn" type="button" (click)="cancel()" [disabled]="isSaving">Cancel</button>
          <button class="btn btn-primary" type="submit" [disabled]="!roleForm.form.valid || isSaving">
            <ng-container *ngIf="isSaving"><span class="loading loading-spinner loading-sm mr-2"></span>Saving...</ng-container>
            <ng-container *ngIf="!isSaving">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h3l2-2h4l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-8H7v8" />
              </svg>
              Save
            </ng-container>
          </button>
        </div>
      </form>
    </div>
  </dialog>

  <dialog #roleDeleteModal id="role-delete-modal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-md py-4">
      <div class="flex flex-col items-center text-center">
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01" />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-bold text-base-content">Confirm Deletion</h3>
        <p class="mb-5 text-base text-base-content/70">Are you sure you want to delete <strong class="text-base-content">{{ deleteItemName }}</strong>?</p>
        <div class="flex w-full gap-3">
          <button class="btn btn-ghost flex-1" type="button" (click)="closeDeleteModal()" [disabled]="deletingInProgress">Cancel</button>
          <button class="btn btn-error flex-1" type="button" (click)="confirmDelete()" [disabled]="deletingInProgress">
            <ng-container *ngIf="deletingInProgress"><span class="loading loading-spinner loading-sm mr-2"></span>Deleting...</ng-container>
            <ng-container *ngIf="!deletingInProgress">Yes, Delete</ng-container>
          </button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="button" (click)="closeDeleteModal()">close</button>
    </form>
  </dialog>
</div>
  `,
  styles: []
})
export class RoleManagementComponent implements OnInit, OnDestroy {
  @ViewChild('roleFormModal') private roleFormModal?: ElementRef<HTMLDialogElement>;
  @ViewChild('roleDeleteModal') private roleDeleteModal?: ElementRef<HTMLDialogElement>;

  // Pagination properties
  currentPage = 1;
  pageSize = 5;
  totalItems = 0;
  pageSizeOptions = [5, 10, 20, 50];

  get pagedRoles() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.roles.slice(start, start + this.pageSize);
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
    // Autocomplete + chips state for permissions
    permissionInput = '';
    filteredPermissionSuggestions: { name: string }[] = [];
    showPermissionSuggestions = false;
    // Filter suggestions based on input and already selected permissions
    filterPermissionSuggestions() {
      const input = this.permissionInput.trim().toLowerCase();
      const selectedPermissions = new Set((this.selectedRole?.permissions ?? []).map(p => p.toLowerCase()));

      this.filteredPermissionSuggestions = this.permissionsList
        .filter(p => !selectedPermissions.has(p.name.toLowerCase()))
        .filter(p => input ? p.name.toLowerCase().includes(input) : true)
        .slice(0, 20)
        .map(p => ({ name: p.name }));

      this.showPermissionSuggestions = true;
    }

    // Add a permission chip from input (if valid)
    addPermissionChip() {
      if (!this.permissionInput) return;
      const normalizedInput = this.permissionInput.trim().toLowerCase();
      if (!normalizedInput) return;

      const exactMatch = this.permissionsList.find(p => p.name.toLowerCase() === normalizedInput);
      const fallback = this.filteredPermissionSuggestions[0];
      const target = exactMatch?.name ?? fallback?.name;

      if (target) {
        this.addPermissionByName(target);
      }
    }

    // Add a permission chip from suggestion click
    selectPermissionSuggestion(name: string, event?: MouseEvent) {
      event?.preventDefault();
      this.addPermissionByName(name);
    }

    // Remove a permission chip
    removePermissionChip(name: string) {
      if (this.selectedRole) {
        this.selectedRole.permissions = this.selectedRole.permissions.filter(p => p !== name);
        this.filterPermissionSuggestions();
        this.cdr.detectChanges();
      }
    }

    onPermissionInputEnter(event: Event) {
      event.preventDefault();
      this.addPermissionChip();
    }

    showPermissionSuggestionList() {
      this.filterPermissionSuggestions();
    }

    hidePermissionSuggestions() {
      this.showPermissionSuggestions = false;
    }

    hidePermissionSuggestionsDelayed() {
      setTimeout(() => this.hidePermissionSuggestions(), 120);
    }

    private addPermissionByName(name: string) {
      if (!this.selectedRole) return;

      const exists = this.selectedRole.permissions.some(p => p.toLowerCase() === name.toLowerCase());
      if (!exists) {
        this.selectedRole.permissions.push(name);
      }

      this.permissionInput = '';
      this.filteredPermissionSuggestions = [];
      this.showPermissionSuggestions = false;
      this.cdr.detectChanges();
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
  // lifecycle + loading
  private destroy$ = new Subject<void>();
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  
  // Track original role data for comparison
  originalPermissions: string[] = [];
  originalRoleName = '';

  constructor(private roleService: RoleService, private permissionService: PermissionService) {}

  ngOnInit(): void {
    this.loadRoles();
    this.permissionService.getPermissions().pipe(
      takeUntil(this.destroy$)
    ).subscribe(perms => {
      this.permissionsList = perms;
      this.cdr.detectChanges();
    });
  }

  // Removed permissionsString getter/setter (now using multi-select)

  loadRoles() {
    this.isLoading = true;
    this.roleService.getRoles().pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.isLoading = false; this.cdr.detectChanges(); })
    ).subscribe(roles => {
      this.roles = roles.map(role => ({
        ...role,
        permissions: role.permissions ?? []
      }));
      this.totalItems = this.roles.length;
      this.currentPage = 1;
      this.cdr.detectChanges();
    });
  }

  startCreate() {
    this.selectedRole = { id: '', name: '', permissions: [] };
    this.isCreating = true;
    this.isEditing = false;
    this.permissionInput = '';
    this.filteredPermissionSuggestions = [];
    this.showPermissionSuggestions = false;
    this.openRoleFormModal();
  }

  startEdit(role: Role) {
    console.log('Editing role - original data:', role);
    console.log('Role permissions:', role.permissions);
    
    // If permissions are not loaded, fetch them
    if (!role.permissions || role.permissions.length === 0) {
      console.log('Fetching permissions for role:', role.name);
      this.roleService.getRolePermissions(role.name).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
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
          this.showPermissionSuggestions = false;
          
          console.log('Selected role for edit:', this.selectedRole);
          console.log('Selected role permissions:', this.selectedRole?.permissions);
          console.log('Original permissions:', this.originalPermissions);
          console.log('Original role name:', this.originalRoleName);
          
          this.openRoleFormModal();
        },
        error: (error) => {
          console.error('Error fetching role permissions:', error);
          // Still open modal with empty permissions
          this.selectedRole = { ...role, permissions: [] };
          this.originalPermissions = [];
          this.originalRoleName = role.name;
          this.isEditing = true;
          this.isCreating = false;
          this.permissionInput = '';
          this.filteredPermissionSuggestions = [];
          this.showPermissionSuggestions = false;
          this.openRoleFormModal();
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
      this.showPermissionSuggestions = false;
      
      this.openRoleFormModal();
    }
  }

  cancel() {
    this.closeDialog(this.roleFormModal?.nativeElement);
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
      this.isSaving = true;
      this.roleService.createRole(this.selectedRole).pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isSaving = false; this.cdr.detectChanges(); })
      ).subscribe({
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

        this.isSaving = true;
        forkJoin(permissionOperations).pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; this.cdr.detectChanges(); })
        ).subscribe({
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
        this.isSaving = true;
        this.roleService.updateRole({
          id: currentRole.id,
          name: currentRole.name,
          permissions: currentPermissions
        }).pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isSaving = false; this.cdr.detectChanges(); })
        ).subscribe({
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
    this.openDialog(this.roleDeleteModal?.nativeElement);
  }

  closeDeleteModal() {
    this.closeDialog(this.roleDeleteModal?.nativeElement);
    this.deleteItemId = null;
    this.deleteItemName = '';
    this.deletingInProgress = false;
    this.cdr.detectChanges();
  }

  private openRoleFormModal() {
    this.cdr.detectChanges();
    this.openDialog(this.roleFormModal?.nativeElement);
  }

  private openDialog(dialog?: HTMLDialogElement) {
    if (!dialog) return;
    if (dialog.open) return;
    try {
      dialog.showModal();
    } catch {
      dialog.setAttribute('open', '');
    }
  }

  private closeDialog(dialog?: HTMLDialogElement) {
    if (!dialog) return;
    if (dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  confirmDelete() {
    if (!this.deleteItemId) return;
    this.deletingInProgress = true;
    this.cdr.detectChanges();
    this.roleService.deleteRole(this.deleteItemId).pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.deletingInProgress = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        this.loadRoles();
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('Failed to delete role:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
