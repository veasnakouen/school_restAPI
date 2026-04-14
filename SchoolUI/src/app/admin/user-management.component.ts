import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { User } from './user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  isEditing = false;
  isCreating = false;

  userToToggle: User | null = null;
  showConfirmModal = false;

  userToDelete: User | null = null;
  showDeleteConfirmModal = false;
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

  constructor(
    private userService: UserService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadAvailableRoles();
  }

  // Load available roles from the API
  loadAvailableRoles() {
    this.roleService.getRoles().subscribe({
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

  // Pagination functionality
  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  get totalPages(): number {
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

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
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
    this.cdr.detectChanges();
    setTimeout(() => {
      const modal = document.getElementById('create-user-modal') as HTMLDialogElement;
      if (modal) modal.showModal();
    });
  }

  closeCreateUserModal() {
    const modal = document.getElementById('create-user-modal') as HTMLDialogElement;
    if (modal) modal.close();
    this.showCreateModal = false;
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
    setTimeout(() => {
      const modal = document.getElementById('user-message-modal') as HTMLDialogElement;
      if (modal) modal.showModal();
    });
  }

  closeUserMessageModal() {
    const modal = document.getElementById('user-message-modal') as HTMLDialogElement;
    if (modal) modal.close();
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

    this.userService.createUser(userPayload).pipe(
      finalize(() => this.cdr.detectChanges())
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
      this.userService.getUserRolesAndClaims(user.id).subscribe({
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

          console.log('Selected user for edit:', this.selectedUser);
          console.log('Selected user roles:', this.selectedUser?.roles);
          console.log('Original roles:', this.originalRoles);

          this.cdr.detectChanges();
          setTimeout(() => {
            const modal = document.getElementById('user-form-modal') as HTMLDialogElement;
            if (modal) modal.showModal();
          });
        },
        error: (error) => {
          console.error('Error fetching user roles:', error);
          // Still open modal with empty roles
          this.selectedUser = { ...user, password: '', roles: [] };
          this.originalRoles = [];
          this.isEditing = true;
          this.isCreating = false;
          this.cdr.detectChanges();
          setTimeout(() => {
            const modal = document.getElementById('user-form-modal') as HTMLDialogElement;
            if (modal) modal.showModal();
          });
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

      console.log('Selected user for edit:', this.selectedUser);
      console.log('Selected user roles:', this.selectedUser?.roles);
      console.log('Original roles:', this.originalRoles);

      this.cdr.detectChanges();
      setTimeout(() => {
        const modal = document.getElementById('user-form-modal') as HTMLDialogElement;
        if (modal) modal.showModal();
      });
    }
  }

  cancel() {
    const modal = document.getElementById('user-form-modal') as HTMLDialogElement;
    if (modal) modal.close();
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

        this.userService.updateUser({ ...userToSave }).pipe(
          finalize(() => this.cdr.detectChanges())
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

    forkJoin(allOperations).pipe(
      finalize(() => this.cdr.detectChanges())
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
    this.userToToggle = user;
    this.showConfirmModal = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      const modal = document.getElementById('user-confirm-modal') as HTMLDialogElement;
      if (modal) modal.showModal();
    });
  }

  confirmToggle() {
    if (this.userToToggle) {
      this.userService.toggleUserStatus(this.userToToggle.id).pipe(
        finalize(() => this.cdr.detectChanges())
      ).subscribe(() => {
        this.loadUsers();
        this.closeConfirmModal();
      });
    }
  }

  closeConfirmModal() {
    const modal = document.getElementById('user-confirm-modal') as HTMLDialogElement;
    if (modal) modal.close();
    this.showConfirmModal = false;
    this.userToToggle = null;
    this.cdr.detectChanges();
  }

  deleteUser(user: User) {
    this.userToDelete = user;
    this.showDeleteConfirmModal = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      const modal = document.getElementById('user-delete-confirm-modal') as HTMLDialogElement;
      if (modal) modal.showModal();
    });
  }

  confirmDelete() {
    if (this.userToDelete) {
      this.userService.deleteUser(this.userToDelete.id).pipe(
        finalize(() => this.cdr.detectChanges())
      ).subscribe({
        next: (response) => {
          console.log('User deleted successfully:', response);
          this.loadUsers();
          this.closeDeleteConfirmModal();
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
          this.closeDeleteConfirmModal();
        }
      });
    }
  }

  closeDeleteConfirmModal() {
    const modal = document.getElementById('user-delete-confirm-modal') as HTMLDialogElement;
    if (modal) modal.close();
    this.showDeleteConfirmModal = false;
    this.userToDelete = null;
    this.cdr.detectChanges();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  isLocked(user: User | null): boolean {
    if (!user || !user.lockoutEnd) return false;
    return new Date(user.lockoutEnd) > new Date();
  }
}
