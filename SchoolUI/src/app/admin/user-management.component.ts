import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { User } from './user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { finalize, takeUntil } from 'rxjs/operators';
import { forkJoin, of, Subject } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, SharedModule } from 'primeng/api';

const USER_MANAGEMENT_TEMPLATE = `
<div class="pt-0 px-3 pb-3 max-w-5xl mx-auto">
  <!-- Header Section -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
    <div class="flex items-center gap-3">
      <app-avatar size="md" shape="rounded" alt="User management"></app-avatar>
      <div>
        <h2 class="text-2xl font-bold text-base-content">User Management</h2>
        <p class="text-base-content/60 text-sm mt-0.5">Manage system users, roles, and access status</p>
      </div>
    </div>
    <p-button label="Add User" icon="pi pi-user-plus" (onClick)="startCreate()" [disabled]="isLoadingCreate"></p-button>
  </div>

  <!-- Table Card -->
   <div class="bg-base-100 shadow-sm border border-base-300 rounded-lg my-3 overflow-hidden">
    <!-- Filter Bar -->
    <div class="p-4 border-b border-base-300 bg-base-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div class="relative w-full sm:w-72">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>
        <input pInputText type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()" placeholder="Search users..." class="w-full pl-10 p-inputtext-sm" />
      </div>

      <div class="flex gap-2 items-center w-full sm:w-auto">
        <select class="p-inputtext p-component p-inputtext-sm py-1.5 appearance-none" [(ngModel)]="statusFilter" (ngModelChange)="onStatusFilterChange()">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="locked">Locked</option>
        </select>
        @if (searchQuery || statusFilter !== 'all') {
          <p-button label="Clear" icon="pi pi-filter-slash" severity="secondary" [text]="true" (onClick)="clearFilters()"></p-button>
        }
      </div>
    </div>

    <p-table [value]="filteredUsers" [loading]="isLoadingSave || isLoadingDelete || isLoadingToggle || isLoadingCreate" [paginator]="true" [rows]="pageSize" [rowsPerPageOptions]="pageSizeOptions" styleClass="p-datatable-striped p-datatable-sm [&_td]:!px-4 [&_td]:!py-3" [tableStyle]="{'min-width': '40rem'}">
      <ng-template pTemplate="header">
          <tr>
            <th>User</th>
            <th>Contact Info</th>
            <th>Status</th>
            <th class="text-center">Actions</th>
          </tr>
      </ng-template>
      <ng-template pTemplate="body" let-user>
            <tr>
              <td>
                <div class="flex items-center gap-3">
                  <app-avatar [src]="user.imageUrl" [initials]="user.userName.charAt(0).toUpperCase()" alt="{{user.userName}}" size="sm" shape="squircle"></app-avatar>
                  <div>
                    <div class="font-bold text-base-content">{{ user.userName }}</div>
                    <div class="text-xs font-mono text-base-content/50">ID: {{ user.id.substring(0, 8) }}...</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-base-content/80 text-sm">
                    <i class="pi pi-envelope text-base-content/40"></i>
                    <span>{{ user.email }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-base-content/80 text-sm">
                    <i class="pi pi-phone text-base-content/40"></i>
                    <span *ngIf="user.phoneNumber">{{ user.phoneNumber }}</span>
                    <span *ngIf="!user.phoneNumber" class="italic text-base-content400">No phone</span>
                  </div>
                </div>
              </td>
              <td>
                <p-badge [value]="isLocked(user) ? 'Locked' : 'Active'" [severity]="isLocked(user) ? 'danger' : 'success'"></p-badge>
              </td>
              <td>
                <div class="flex gap-2 justify-center">
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" (onClick)="startEdit(user)" pTooltip="Edit User" tooltipPosition="top" [disabled]="isLoadingSave || isLoadingDelete || isLoadingToggle"></p-button>
                  <p-button [icon]="isLocked(user) ? 'pi pi-lock-open' : 'pi pi-lock'" [rounded]="true" [text]="true" [severity]="isLocked(user) ? 'success' : 'warn'" (onClick)="toggleUserStatus(user)" [pTooltip]="isLocked(user) ? 'Unlock User' : 'Lock User'" tooltipPosition="top" [disabled]="isLoadingSave || isLoadingDelete || isLoadingToggle"></p-button>
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="deleteUser(user)" pTooltip="Delete User" tooltipPosition="top" [disabled]="isLoadingSave || isLoadingDelete || isLoadingToggle"></p-button>
                </div>
              </td>
            </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="4" class="text-center py-8 text-base-content/50">
            <i class="pi pi-search text-4xl mb-3 block text-base-content/30"></i>
            <h3 class="text-lg font-semibold mb-2 text-base-content/70">No users found</h3>
            <p class="mb-3">
              <span *ngIf="searchQuery || statusFilter !== 'all'">No users match your current filters. Try adjusting your search criteria.</span>
              <span *ngIf="!searchQuery && statusFilter === 'all'">There are currently no users in the system.</span>
            </p>
            <p-button *ngIf="!searchQuery && statusFilter === 'all'" label="Create First User" icon="pi pi-user-plus" (onClick)="startCreate()" [disabled]="isLoadingCreate"></p-button>
          </td>
        </tr>
      </ng-template>
    </p-table>
    </div>

  <!-- Create/Edit Modal -->
  <p-dialog header="Edit User" [(visible)]="isEditing" [modal]="true" [dismissableMask]="true" [style]="{width: '100%', maxWidth: '600px'}" (onHide)="cancel()">
    <form (ngSubmit)="saveUser()" #userForm="ngForm" class="space-y-4 pt-2" *ngIf="selectedUser">
      <div class="flex flex-col w-full">
        <label class="py-2">
          <span class="font-semibold text-base-content700 text-sm">Username <span class="text-red-500">*</span></span>
          </label>
          <input
            pInputText
            type="text"
            [(ngModel)]="selectedUser.userName"
            name="userName"
            required
            placeholder="e.g. jsmith"
            class="w-full"
          />
        </div>

      <div class="flex flex-col w-full">
        <label class="py-2">
          <span class="font-semibold text-base-content700 text-sm">Full Name</span>
          </label>
          <input
            pInputText
            type="text"
            [(ngModel)]="selectedUser.fullName"
            name="fullName"
            placeholder="e.g. John Smith"
            class="w-full"
          />
        </div>

      <div class="flex flex-col w-full">
        <label class="py-2">
          <span class="font-semibold text-base-content700 text-sm">Email Address <span class="text-red-500">*</span></span>
          </label>
          <input
            pInputText
            type="email"
            [(ngModel)]="selectedUser.email"
            name="email"
            required
            placeholder="user@example.com"
            class="w-full"
          />
        </div>

      <div class="flex flex-col w-full">
        <label class="py-2">
          <span class="font-semibold text-base-content700 text-sm">Phone Number</span>
          </label>
          <input
            pInputText
            type="tel"
            [(ngModel)]="selectedUser.phoneNumber"
            name="phoneNumber"
            placeholder="e.g. +1234567890"
            class="w-full"
          />
        </div>

      <div class="flex flex-col w-full">
        <label class="py-2">
          <span class="font-semibold text-base-content700 text-sm">New Password (leave blank to keep current)</span>
          </label>
        <div class="relative w-full">
            <input
              pInputText
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="selectedUser.password"
              name="password"
              placeholder="Enter new password (optional)"
              class="w-full pr-12"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-base-content500 hover:text-base-content700"
              (click)="togglePasswordVisibility()"
            >
              <i class="pi" [ngClass]="showPassword ? 'pi-eye-slash' : 'pi-eye'"></i>
            </button>
          </div>
        <span class="text-xs text-yellow-600 mt-1"><i class="pi pi-exclamation-triangle text-xs mr-1"></i>Leave blank to keep the current password</span>
        </div>

      <div class="flex flex-col w-full">
        <label class="py-2">
          <span class="font-semibold text-base-content700 text-sm">Roles</span>
          </label>
          <div class="relative w-full">
            <div class="flex flex-wrap gap-2 mb-2">
              <span *ngFor="let role of selectedUser.roles" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {{ role }}
                <button type="button" class="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none" (click)="removeRole(role)">✕</button>
              </span>
            </div>
            <input pInputText type="text" [(ngModel)]="roleInput" name="roleInput" autocomplete="off"
              (input)="filterRoleSuggestions()" (keydown.enter)="$event.preventDefault(); addRole(roleInput)"
              class="w-full" placeholder="Type to search roles..." />
            <ul *ngIf="filteredRoleSuggestions.length > 0 && roleInput" class="absolute left-0 right-0 top-full mt-1 z-[100] bg-base-100 rounded-lg shadow-lg border border-base-300 max-h-44 overflow-y-auto">
              <li *ngFor="let suggestion of filteredRoleSuggestions" class="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm" (mousedown)="selectRoleSuggestion(suggestion)">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        <span class="text-xs text-base-content500 mt-1">Select one or more roles from the suggestions.</span>
        </div>

        <div class="flex justify-end gap-2 border-t border-base-300 pt-4 mt-6">
          <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="cancel()" [disabled]="isLoadingSave"></p-button>
          <p-button label="Save Changes" icon="pi pi-check" type="submit" [disabled]="!userForm.form.valid || isLoadingSave" [loading]="isLoadingSave"></p-button>
        </div>
      </form>
  </p-dialog>

  <p-dialog header="Create New User" [(visible)]="showCreateModal" [modal]="true" [dismissableMask]="true" [style]="{width: '100%', maxWidth: '600px'}" (onHide)="closeCreateUserModal()">
      <form (ngSubmit)="createUser()" #createUserForm="ngForm" class="space-y-4 pt-2">
        <div class="flex flex-col w-full">
          <label class="py-2">
            <span class="font-semibold text-base-content700 text-sm">Username <span class="text-red-500">*</span></span>
          </label>
          <input
            pInputText
            type="text"
            [(ngModel)]="newUser.userName"
            name="userName"
            required
            placeholder="e.g. jsmith"
            class="input input-bordered w-full"
            pattern="^[a-zA-Z0-9]+$"
            #userNameInput="ngModel"
          />
          <span class="text-xs text-red-500 mt-1" *ngIf="userNameInput.invalid && (userNameInput.dirty || userNameInput.touched)">Username can only contain letters and digits.</span>
        </div>

        <div class="flex flex-col w-full">
          <label class="py-2">
            <span class="font-semibold text-base-content700 text-sm">Full Name <span class="text-red-500">*</span></span>
          </label>
          <input
            pInputText
            type="text"
            [(ngModel)]="newUser.fullName"
            name="fullName"
            required
            placeholder="John Smith"
            class="w-full"
          />
        </div>

        <div class="flex flex-col w-full">
          <label class="py-2">
            <span class="font-semibold text-base-content700 text-sm">Email Address <span class="text-red-500">*</span></span>
          </label>
          <input
            pInputText
            type="email"
            [(ngModel)]="newUser.email"
            name="email"
            required
            placeholder="user@example.com"
            class="w-full"
          />
        </div>

        <div class="flex flex-col w-full">
          <label class="py-2">
            <span class="font-semibold text-base-content700 text-sm">Password <span class="text-red-500">*</span></span>
          </label>
          <div class="relative w-full">
          <input
              pInputText
              [type]="showPassword ? 'text' : 'password'"
            [(ngModel)]="newUser.password"
            name="password"
            required
            placeholder="Min. 6 characters"
              class="w-full pr-12"
          />
            <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-base-content500 hover:text-base-content700" (click)="togglePasswordVisibility()">
              <i class="pi" [ngClass]="showPassword ? 'pi-eye-slash' : 'pi-eye'"></i>
            </button>
          </div>
        </div>

        <div class="flex flex-col w-full">
          <label class="py-2">
            <span class="font-semibold text-base-content700 text-sm">Roles</span>
          </label>
          <div class="relative w-full">
            <div class="flex flex-wrap gap-2 mb-2">
              <span *ngFor="let role of newUser.roles" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {{ role }}
                <button type="button" class="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none" (click)="removeCreateRole(role)">✕</button>
              </span>
            </div>
            <input
              pInputText
              type="text"
              [(ngModel)]="newUser.roleInput"
              name="createRoleInput"
              autocomplete="off"
              (input)="filterCreateRoleSuggestions()"
              (keydown.enter)="$event.preventDefault(); addCreateRole(newUser.roleInput)"
              class="w-full"
              placeholder="Type to search roles..."
            />
            <ul *ngIf="filteredCreateRoleSuggestions.length > 0 && newUser.roleInput" class="absolute left-0 right-0 top-full mt-1 z-[100] bg-base-100 rounded-lg shadow-lg border border-base-300 max-h-44 overflow-y-auto">
              <li *ngFor="let suggestion of filteredCreateRoleSuggestions" class="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm" (mousedown)="selectCreateRoleSuggestion(suggestion)">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-base-300 pt-4 mt-6">
          <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="closeCreateUserModal()"></p-button>
          <p-button label="Create User" icon="pi pi-check" type="submit" [disabled]="!createUserForm.form.valid || !newUser.userName || !newUser.fullName || !newUser.email || !newUser.password || isLoadingCreate" [loading]="isLoadingCreate"></p-button>
        </div>
      </form>
  </p-dialog>

  <p-dialog [header]="userMessageTitle" [(visible)]="showMessageModal" [modal]="true" [dismissableMask]="true" [style]="{width: '100%', maxWidth: '400px'}" (onHide)="closeUserMessageModal()">
    <div class="flex flex-col items-center text-center pt-2">
      <p class="text-base-content700 mb-4">{{ userMessageContent }}</p>
      <div class="flex w-full mt-4 border-t border-base-300 pt-4">
        <p-button label="OK" severity="primary" styleClass="w-full" (onClick)="closeUserMessageModal()"></p-button>
      </div>
    </div>
  </p-dialog>
</div>
`;

const USER_MANAGEMENT_STYLES = ``;

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, TableModule, DialogModule, ButtonModule, BadgeModule, InputTextModule, TooltipModule, SharedModule,],
  template: USER_MANAGEMENT_TEMPLATE,
  styles: [USER_MANAGEMENT_STYLES]
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Loading flags
  isLoadingCreate = false;
  isLoadingSave = false;
  isLoadingDelete = false;
  isLoadingToggle = false;

  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  isEditing = false;
  isCreating = false;

  userToToggle: User | null = null;
  userToDelete: User | null = null;
  showPassword = false;

  // Pagination properties
  currentPage = 1;
  pageSize = 5;
  totalItems = 0;
  pageSizeOptions = [5, 10, 20, 50];

  // Filter properties
  searchQuery = '';
  statusFilter = 'all'; // 'all', 'active', 'locked'

  // Edit user roles autocomplete properties
  roleInput = '';
  filteredRoleSuggestions: string[] = [];
  availableRoles: string[] = [];
  originalRoles: string[] = []; // Store original roles for comparison

  // Create user properties
  showCreateModal = false;
  newUser = {
    userName: '',
    fullName: '',
    email: '',
    password: '',
    roles: [] as string[],
    roleInput: ''
  };
  filteredCreateRoleSuggestions: string[] = [];
  userMessageTitle = '';
  userMessageContent = '';
  showMessageModal = false;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadAvailableRoles();
  }

  // Load available roles from the API
  loadAvailableRoles() {
    this.roleService.getRoles().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (roles) => {
        this.availableRoles = roles.map(role => role.name);
        console.log('Loaded available roles:', this.availableRoles);
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        // Fallback to a default set if API fails
        this.availableRoles = ['Admin', 'Teacher', 'Student'];
      }
    });
  }

  // Roles autocomplete functionality
  filterRoleSuggestions() {
    const input = this.roleInput.toLowerCase();
    this.filteredRoleSuggestions = this.availableRoles.filter(role =>
      role.toLowerCase().includes(input) &&
      !this.selectedUser?.roles?.includes(role)
    );
  }

  addRole(role: string) {
    if (this.selectedUser && role && !this.selectedUser.roles?.includes(role)) {
      if (!this.selectedUser.roles) {
        this.selectedUser.roles = [];
      }
      this.selectedUser.roles.push(role);
      this.roleInput = '';
      this.filteredRoleSuggestions = [];
      this.cdr.detectChanges();
    }
  }

  selectRoleSuggestion(role: string) {
    this.addRole(role);
  }

  removeRole(role: string) {
    if (this.selectedUser && this.selectedUser.roles) {
      this.selectedUser.roles = this.selectedUser.roles.filter(r => r !== role);
      this.cdr.detectChanges();
    }
  }

  loadUsers() {
    this.userService.getUsers().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.cdr.detectChanges())
    ).subscribe({
      next: (users) => {
        console.log('Users loaded:', users);
        this.users = users || [];
        this.filteredUsers = [...this.users];
        this.totalItems = this.users.length;
        this.currentPage = 1;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.users = [];
        this.filteredUsers = [];
        this.totalItems = 0;
        this.cdr.detectChanges();
      }
    });
  }

  // Filter and search functionality
  applyFilters() {
    let result = [...this.users];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(user =>
        user.userName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.statusFilter === 'active') {
      result = result.filter(user => !this.isLocked(user));
    } else if (this.statusFilter === 'locked') {
      result = result.filter(user => this.isLocked(user));
    }

    this.filteredUsers = result;
    this.totalItems = result.length;
    this.currentPage = 1; // Reset to first page when filters change
    this.cdr.detectChanges();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  // Create User Modal Methods
  openCreateUserModal() {
    this.newUser = {
      userName: '',
      fullName: '',
      email: '',
      password: '',
      roles: [],
      roleInput: ''
    };
    this.filteredCreateRoleSuggestions = [];
    this.showCreateModal = true;
  }

  closeCreateUserModal() {
    this.showCreateModal = false;
  }

  // Create user role autocomplete
  filterCreateRoleSuggestions() {
    const input = this.newUser.roleInput.toLowerCase();
    this.filteredCreateRoleSuggestions = this.availableRoles.filter(role =>
      role.toLowerCase().includes(input) &&
      !this.newUser.roles.includes(role)
    );
  }

  addCreateRole(role: string) {
    if (role && !this.newUser.roles.includes(role)) {
      this.newUser.roles.push(role);
      this.newUser.roleInput = '';
      this.filteredCreateRoleSuggestions = [];
      this.cdr.detectChanges();
    }
  }

  selectCreateRoleSuggestion(role: string) {
    this.addCreateRole(role);
  }

  removeCreateRole(role: string) {
    this.newUser.roles = this.newUser.roles.filter(r => r !== role);
    this.cdr.detectChanges();
  }

  showUserMessage(title: string, content: string) {
    this.userMessageTitle = title;
    this.userMessageContent = content;
    this.showMessageModal = true;
  }

  closeUserMessageModal() {
    this.showMessageModal = false;
  }

  createUser() {
    if (!this.newUser.userName || !this.newUser.fullName || !this.newUser.email || !this.newUser.password) {
      this.showUserMessage('Validation Error', 'Please fill in all required fields.');
      return;
    }

    const usernamePattern = /^[a-zA-Z0-9]+$/;
    if (!usernamePattern.test(this.newUser.userName)) {
      this.showUserMessage('Validation Error', 'Username can only contain letters and digits (no spaces or special characters).');
      return;
    }

    // Prepare user data
    const userPayload = {
      userName: this.newUser.userName,
      fullName: this.newUser.fullName,
      email: this.newUser.email,
      password: this.newUser.password,
      roles: this.newUser.roles.length > 0 ? this.newUser.roles : ['User'] // Default to User role
    };

    console.log('Creating user:', userPayload);

    this.isLoadingCreate = true;
    this.userService.createUser(userPayload).pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.isLoadingCreate = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (response) => {
        console.log('User created successfully:', response);
        this.loadUsers();
        this.closeCreateUserModal();
        this.showUserMessage('Success', 'User created successfully.');
      },
      error: (error) => {
        console.error('❌ Error creating user:', error);
        console.error('Status:', error?.status);
        console.error('Error body:', error?.error);
        
        let errorMsg = 'Failed to create user';
        if (error?.status === 400 && error?.error) {
          errorMsg = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
        } else if (error?.status === 401) {
          errorMsg = 'Authentication required. Please log in again.';
        } else if (error?.status === 403) {
          errorMsg = 'You do not have permission to create users.';
        }
        
        this.showUserMessage('Error', errorMsg);
      }
    });
  }

  startCreate() {
    this.openCreateUserModal();
  }

  startEdit(user: User) {
    console.log('Editing user - original data:', user);
    console.log('User roles:', user.roles);

    // Reset password visibility and field
    this.showPassword = false;

    // If roles are not loaded, fetch them
      if (!user.roles || user.roles.length === 0) {
      console.log('Fetching roles for user:', user.userName);
      this.userService.getUserRolesAndClaims(user.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (rolesAndClaims) => {
          console.log('Fetched roles and claims:', rolesAndClaims);
          const roles = rolesAndClaims.roles || [];
          this.selectedUser = {
            ...user,
            password: '', // Initialize password as empty
            roles: [...roles]
          };
          this.originalRoles = [...roles]; // Store original roles
          this.isEditing = true;
          this.isCreating = false;
          this.roleInput = '';
          this.filteredRoleSuggestions = [];
        },
        error: (error) => {
          console.error('Error fetching user roles:', error);
          // Still open modal with empty roles
          this.selectedUser = { ...user, password: '', roles: [] };
          this.originalRoles = [];
          this.isEditing = true;
          this.isCreating = false;
        }
      });
    } else {
      this.selectedUser = {
        ...user,
        password: '', // Initialize password as empty
        roles: [...user.roles]
      };
      this.originalRoles = [...user.roles]; // Store original roles
      this.isEditing = true;
      this.isCreating = false;
      this.roleInput = '';
      this.filteredRoleSuggestions = [];
    }
  }

  cancel() {
    this.selectedUser = null;
    this.isEditing = false;
    this.isCreating = false;
    this.cdr.detectChanges();
  }

  saveUser() {
    if (!this.selectedUser) return;

    console.log('Saving user:', this.selectedUser);
    console.log('Original roles:', this.originalRoles);
    console.log('New roles:', this.selectedUser.roles ?? []);

    if (this.isCreating) {
      // User creation is not supported through this interface
      console.error('User creation is not supported through this interface');
      this.showUserMessage('Error', 'User creation is not available. Please use the registration system.');
      this.cancel();
    } else if (this.isEditing) {
      // Extract to local constant for proper TypeScript control flow analysis
      const userToSave = this.selectedUser;
      if (!userToSave || !userToSave.roles) {
        console.error('No user or roles selected for editing');
        this.cancel();
        return;
      }

      const userId = userToSave.id;
      const currentRoles = userToSave.roles as string[];

      // Check if user details (username/email) have changed
      const originalUser = this.users.find(u => u.id === userId);
      const userDetailsChanged = originalUser && (
        originalUser.userName !== userToSave.userName ||
        originalUser.email !== userToSave.email
      );

      console.log('Original user:', originalUser);
      console.log('User details changed:', userDetailsChanged);

      // Calculate role changes
      const rolesToAdd = currentRoles.filter(role => !this.originalRoles.includes(role));
      const rolesToRemove = this.originalRoles.filter(role => !currentRoles.includes(role));

      console.log('Roles to add:', rolesToAdd);
      console.log('Roles to remove:', rolesToRemove);

      // If no changes, just close the modal
      if (!userDetailsChanged && rolesToAdd.length === 0 && rolesToRemove.length === 0) {
        console.log('No changes to save');
        this.loadUsers();
        this.cancel();
        return;
      }

      // If user details changed, call the update API
      if (userDetailsChanged) {
        console.log('Updating user details...');
        const updatePayload = {
          userName: userToSave.userName,
          email: userToSave.email,
          roles: currentRoles
        };

        this.isLoadingSave = true;
        this.userService.updateUser({ ...userToSave }).pipe(
          takeUntil(this.destroy$),
          finalize(() => { this.isLoadingSave = false; this.cdr.detectChanges(); })
        ).subscribe({
          next: (response) => {
            console.log('User details updated successfully:', response);
            
            // Now handle role changes if any
            if (rolesToAdd.length > 0 || rolesToRemove.length > 0) {
              this.updateUserRoles(userId, rolesToAdd, rolesToRemove);
            } else {
              this.loadUsers();
              this.cancel();
            }
          },
          error: (error) => {
            console.error('❌ Error updating user details:', error);
            let errorMsg = 'Failed to update user';
            if (error?.status === 400 && error?.error) {
              errorMsg = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
            } else if (error?.status === 401) {
              errorMsg = 'Authentication required. Please log in again.';
            } else if (error?.status === 403) {
              errorMsg = 'You do not have permission to update users.';
            }

            this.showUserMessage('Failed To Update User', errorMsg);
            this.loadUsers();
            this.cancel();
          }
        });
      } else if (rolesToAdd.length > 0 || rolesToRemove.length > 0) {
        // Only role changes, proceed with role updates
        this.updateUserRoles(userId, rolesToAdd, rolesToRemove);
      }
    }
  }

  // Helper method to update user roles
  private updateUserRoles(userId: string, rolesToAdd: string[], rolesToRemove: string[]) {
    let completedOperations = 0;
    let failedOperations = 0;
    const totalOperations = rolesToAdd.length + rolesToRemove.length;

    // Remove old roles first
    const removeOperations = rolesToRemove.map(role => {
      return this.userService.removeRoleFromUser(userId, role).pipe(
        finalize(() => {
          completedOperations++;
          console.log(`Removed role: ${role} (${completedOperations}/${totalOperations})`);
        })
      );
    });

    // Then add new roles
    const addOperations = rolesToAdd.map(role => {
      return this.userService.assignRoleToUser(userId, role).pipe(
        finalize(() => {
          completedOperations++;
          console.log(`Added role: ${role} (${completedOperations}/${totalOperations})`);
        })
      );
    });

    // Combine all operations
    const allOperations = [...removeOperations, ...addOperations];

    console.log(`Executing ${allOperations.length} role operations for user:`, userId);
    this.isLoadingSave = true;

    forkJoin(allOperations).pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.isLoadingSave = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (results) => {
        console.log('User roles updated successfully');
        console.log(`Results:`, results);
        console.log(`Added ${rolesToAdd.length} roles, removed ${rolesToRemove.length} roles`);
        this.loadUsers();
        this.cancel();
      },
      error: (error) => {
        console.error('❌ Error updating user roles:', error);
        console.error('Status:', error?.status);
        console.error('Status Text:', error?.statusText);
        console.error('Error body:', error?.error);
        console.error('Message:', error?.message);
        console.error('URL:', error?.url);
        console.error('Completed operations:', completedOperations, '/', totalOperations);

        // Build a detailed error message
        let errorMsg = 'Unknown error';
        if (error?.status === 401) {
          errorMsg = 'Authentication required. Please log in again.';
        } else if (error?.status === 403) {
          errorMsg = 'You do not have permission to perform this action.';
        } else if (error?.status === 404) {
          errorMsg = error?.error || 'User or role not found.';
        } else if (error?.status === 400) {
          errorMsg = error?.error || 'Invalid request.';
        } else {
          errorMsg = error?.error || error?.message || error?.statusText || 'Server error';
        }

        this.showUserMessage(
          'Failed To Update Roles',
          `Error: ${errorMsg} | Operations: ${completedOperations}/${totalOperations} | Status: ${error?.status || 'Unknown'}`
        );

        this.loadUsers();
        this.cancel();
      }
    });
  }

  toggleUserStatus(user: User) {
    const action = this.isLocked(user) ? 'unlock' : 'lock';
    const message = `Are you sure you want to <strong>${action}</strong> the account for <strong>${user.userName}</strong>?`;

    this.confirmationService.confirm({
        message: message,
        header: 'Confirm Action',
        icon: this.isLocked(user) ? 'pi pi-lock-open' : 'pi pi-lock',
        accept: () => {
            this.userToToggle = user;
            this.confirmToggle();
        },
        reject: () => {
            this.userToToggle = null;
        }
    });
  }

  confirmToggle() {
    if (this.userToToggle) {
      this.isLoadingToggle = true;
      this.userService.toggleUserStatus(this.userToToggle.id).pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isLoadingToggle = false; this.cdr.detectChanges(); })
      ).subscribe(() => {
        this.loadUsers();
        this.userToToggle = null;
      });
    }
  }

  deleteUser(user: User) {
    this.confirmationService.confirm({
        message: `Are you sure you want to <strong>permanently delete</strong> the user <strong>${user.userName}</strong>? This action cannot be undone.`,
        header: 'Confirm Permanent Deletion',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            this.userToDelete = user;
            this.confirmDelete();
        },
        reject: () => {
            this.userToDelete = null;
        }
    });
  }

  confirmDelete() {
    if (this.userToDelete) {
      this.isLoadingDelete = true;
      this.userService.deleteUser(this.userToDelete.id).pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isLoadingDelete = false; this.cdr.detectChanges(); })
      ).subscribe({
        next: (response) => {
          console.log('User deleted successfully:', response);
          this.loadUsers();
          this.showUserMessage('Success', response.message || 'User has been permanently deleted.');
        },
        error: (error) => {
          console.error('❌ Error deleting user:', error);
          let errorMsg = 'Failed to delete user';
          if (error?.status === 400 && error?.error) {
            errorMsg = typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
          } else if (error?.status === 401) {
            errorMsg = 'Authentication required. Please log in again.';
          } else if (error?.status === 403) {
            errorMsg = 'You do not have permission to delete users.';
          }

          this.showUserMessage('Failed To Delete User', errorMsg);
        }
      });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  isLocked(user: User | null): boolean {
    if (!user || !user.lockoutEnd) return false;
    return new Date(user.lockoutEnd) > new Date();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
