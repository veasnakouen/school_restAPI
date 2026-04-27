import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { User } from './user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { finalize, takeUntil } from 'rxjs/operators';
import { forkJoin, of, Subject } from 'rxjs';

const USER_MANAGEMENT_TEMPLATE = `
<div class="pt-0 px-3 pb-3 max-w-5xl mx-auto">
  <!-- Header Section -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
    <div class="flex items-center gap-3">
      <app-avatar size="md" shape="rounded" alt="User management"></app-avatar>
      <div>
        <h2 class="text-xl font-semibold">User Management</h2>
        <p class="text-base-content/60 text-sm mt-0.5">Manage system users, roles, and access status</p>
      </div>
    </div>
    <button type="button" class="btn btn-primary btn-sm gap-2" (click)="openCreateUserModal()" title="Add a new user" [disabled]="isLoadingCreate">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
      </svg>
      <span class="hidden sm:inline">Add User</span>
    </button>
  </div>

  <!-- Table Card -->
  <div class="card bg-base-100 shadow-xl my-3">
    <!-- Filter Bar -->
    <div class="card-body pb-2">
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <!-- Search Input -->
        <div class="form-control w-full sm:w-72">
          <div class="input input-bordered flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              placeholder="Search users..."
              class="grow border-none focus:outline-none"
            />
          </div>
        </div>

        <!-- Status Filter -->
        <div class="flex gap-2 items-center w-full sm:w-auto">
          <select
            class="select select-bordered select-sm flex-1 sm:flex-none"
            [(ngModel)]="statusFilter"
            (ngModelChange)="onStatusFilterChange()"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
          </select>

          <!-- Clear Filters Button -->
          <button
            type="button"
            class="btn btn-ghost btn-sm gap-1 flex-none"
            (click)="clearFilters()"
            *ngIf="searchQuery || statusFilter !== 'all'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto px-2 w-full">
      <table class="table whitespace-nowrap">
        <!-- Table Header -->
        <thead>
          <tr>
            <th scope="col">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                User
              </div>
            </th>
            <th scope="col">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Info
              </div>
            </th>
            <th scope="col">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status
              </div>
            </th>
            <th scope="col" class="text-center">
              <div class="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Actions
              </div>
            </th>
          </tr>
        </thead>

        <!-- Table Body - Show data or empty message -->
        <tbody>
          <tr *ngIf="paginatedUsers.length === 0">
            <td colspan="4" class="text-center py-4">
              <div class="text-3xl mb-2">🔍</div>
              <p>
                <span *ngIf="!searchQuery && statusFilter === 'all'">No users match your filters</span>
                <span *ngIf="!searchQuery && statusFilter === 'all'">No users found</span>
              </p>
            </td>
          </tr>
          <tr *ngFor="let user of paginatedUsers; let i = index" [ngClass]="i % 2 === 0 ? 'bg-base-100' : 'bg-base-200'" class="border-b border-base-300 hover:bg-base-200">
              <td>
                <div class="flex items-center gap-3">
                  <app-avatar [src]="user.imageUrl" [initials]="user.userName.charAt(0).toUpperCase()" alt="{{user.userName}}" size="sm" shape="squircle"></app-avatar>
                  <div>
                    <div class="font-bold">{{ user.userName }}</div>
                    <div class="text-xs font-mono">ID: {{ user.id.substring(0, 8) }}...</div>
                  </div>
                </div>
              </td>

              <!-- Contact Info Column -->
              <td>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{{ user.email }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span *ngIf="user.phoneNumber">{{ user.phoneNumber }}</span>
                    <span *ngIf="!user.phoneNumber" class="italic">No phone</span>
                  </div>
                </div>
              </td>

              <!-- Status Column -->
              <td>
                <div class="badge gap-2 badge-lg" [ngClass]="isLocked(user) ? 'badge-error text-error-content' : 'badge-success text-success-content'">
                  <svg *ngIf="!isLocked(user)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg *ngIf="isLocked(user)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span class="font-semibold">{{ isLocked(user) ? 'Locked' : 'Active' }}</span>
                </div>
              </td>

              <!-- Actions Column -->
              <td>
                <div class="flex gap-2 justify-center">
                  <div class="tooltip tooltip-top" data-tip="Edit User">
                    <button
                      type="button"
                      aria-label="Edit user"
                      class="btn btn-ghost btn-sm btn-square"
                      (click)="startEdit(user)"
                      [disabled]="isLoadingSave || isLoadingDelete || isLoadingToggle"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span class="sr-only">Edit user</span>
                    </button>
                  </div>
                  <div class="tooltip tooltip-top" [attr.data-tip]="isLocked(user) ? 'Unlock User' : 'Lock User'">
                    <button
                      type="button"
                      [attr.aria-label]="isLocked(user) ? 'Unlock user' : 'Lock user'"
                      class="btn btn-sm btn-square"
                      [ngClass]="isLocked(user) ? 'btn-success' : 'btn-error'"
                      (click)="toggleUserStatus(user)"
                      [disabled]="isLoadingSave || isLoadingDelete || isLoadingToggle"
                    >
                      <svg *ngIf="!isLocked(user)" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <svg *ngIf="isLocked(user)" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      <span class="sr-only">{{ isLocked(user) ? 'Unlock user' : 'Lock user' }}</span>
                    </button>
                  </div>
                  <div class="tooltip tooltip-top" data-tip="Delete User Permanently">
                    <button
                      type="button"
                      aria-label="Delete user permanently"
                      class="btn btn-error btn-sm btn-square"
                      (click)="deleteUser(user)"
                      [disabled]="isLoadingSave || isLoadingDelete || isLoadingToggle"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span class="sr-only">Delete user permanently</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="text-center py-8" *ngIf="filteredUsers.length === 0">
          <div class="text-4xl mb-3">🔍</div>
          <h3 class="text-lg font-semibold mb-2">No users found</h3>
          <p class="text-base-content/60 mb-3">
            <span *ngIf="searchQuery || statusFilter !== 'all'">
              No users match your current filters. Try adjusting your search criteria.
            </span>
            <span *ngIf="!searchQuery && statusFilter === 'all'">
              There are currently no users in the system.
            </span>
          </p>
          <button type="button" class="btn btn-primary btn-sm gap-2" (click)="startCreate()" *ngIf="!searchQuery && statusFilter === 'all'" [disabled]="isLoadingCreate">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Create First User
          </button>
          <button type="button" class="btn btn-ghost gap-2" (click)="clearFilters()" *ngIf="searchQuery || statusFilter !== 'all'">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear Filters
          </button>
        </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-base-200" *ngIf="filteredUsers.length > 0">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 flex-1 sm:flex-initial">
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
            Showing {{ startIndex }}-{{ endIndex }} of {{ totalItems }} users
          </div>

          <div class="overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <div class="join bg-base-200 flex w-max mx-auto sm:mx-0 sm:justify-end" *ngIf="totalItems > pageSize">
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
  </div>

  <!-- Create/Edit Modal -->
  <dialog id="user-form-modal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-2xl">
      <form method="dialog">
        <button type="submit" aria-label="Close dialog" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h3 class="font-bold text-lg mb-4">
        {{ isCreating ? 'Create New User' : 'Edit User' }}
      </h3>

      <form (ngSubmit)="saveUser()" #userForm="ngForm" class="space-y-4" *ngIf="selectedUser">
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">Username <span class="text-error">*</span></span>
          </label>
          <input
            type="text"
            [(ngModel)]="selectedUser.userName"
            name="userName"
            required
            placeholder="e.g. jsmith"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">Full Name</span>
          </label>
          <input
            type="text"
            [(ngModel)]="selectedUser.fullName"
            name="fullName"
            placeholder="e.g. John Smith"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">Email Address <span class="text-error">*</span></span>
          </label>
          <input
            type="email"
            [(ngModel)]="selectedUser.email"
            name="email"
            required
            placeholder="user@example.com"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">Phone Number</span>
          </label>
          <input
            type="tel"
            [(ngModel)]="selectedUser.phoneNumber"
            name="phoneNumber"
            placeholder="e.g. +1234567890"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">New Password (leave blank to keep current)</span>
          </label>
          <div class="relative">
            <input
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="selectedUser.password"
              name="password"
              placeholder="Enter new password (optional)"
              class="input input-bordered w-full pr-12"
            />
            <button
              type="button"
              class="btn btn-ghost btn-sm absolute right-2 top-1/2 -translate-y-1/2"
              (click)="togglePasswordVisibility()"
            >
              <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          <label class="label">
            <span class="label-text-alt text-warning">⚠️ Leave blank to keep the current password</span>
          </label>
        </div>

        <div class="form-control w-full relative z-30">
          <label class="label">
            <span class="label-text font-semibold">Roles</span>
          </label>
          <div class="relative w-full">
            <div class="max-h-28 overflow-y-auto pr-1 mb-2">
              <div class="flex flex-wrap gap-2">
              <span *ngFor="let role of selectedUser.roles" class="badge badge-primary badge-lg gap-1">
                {{ role }}
                <button type="button" class="btn btn-xs btn-circle btn-ghost ml-1" (click)="removeRole(role)">✕</button>
              </span>
              </div>
            </div>
            <input type="text" [(ngModel)]="roleInput" name="roleInput" autocomplete="off"
              (input)="filterRoleSuggestions()" (keydown.enter)="$event.preventDefault(); addRole(roleInput)"
              class="input input-bordered w-full" placeholder="Type to search roles..." />
            <ul *ngIf="filteredRoleSuggestions.length > 0 && roleInput" class="absolute left-0 right-0 bottom-full mb-1 z-[100] bg-base-100 rounded shadow-lg border border-base-200 max-h-44 overflow-y-auto">
              <li *ngFor="let suggestion of filteredRoleSuggestions" class="px-3 py-2 cursor-pointer hover:bg-base-200" (mousedown)="selectRoleSuggestion(suggestion)">
                {{ suggestion }}
              </li>
            </ul>
          </div>
          <label class="label">
            <span class="label-text-alt">Select one or more roles from the suggestions.</span>
          </label>
        </div>

        <div class="modal-action relative z-10">
          <button type="button" class="btn btn-ghost" (click)="cancel()" [disabled]="isLoadingSave">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!userForm.form.valid || isLoadingSave"
          >
            <ng-container *ngIf="isLoadingSave">
              <span class="loading loading-spinner loading-sm mr-2"></span>
              Saving...
            </ng-container>
            <ng-container *ngIf="!isLoadingSave">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Changes
            </ng-container>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit" aria-label="Close dialog">close</button>
    </form>
  </dialog>

  <dialog id="user-confirm-modal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box">
      <form method="dialog">
        <button type="submit" aria-label="Close dialog" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <div class="flex flex-col items-center text-center" *ngIf="userToToggle">
        <div class="mb-4">
          <div class="rounded-full p-4" [ngClass]="isLocked(userToToggle) ? 'bg-info/10' : 'bg-warning/10'">
            <svg *ngIf="!isLocked(userToToggle)" xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg *ngIf="isLocked(userToToggle)" xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h3 class="font-bold text-lg mb-2">Confirm Action</h3>

        <p class="text-base-content/70 mb-4" *ngIf="!isLocked(userToToggle)">
          Are you sure you want to <strong>lock</strong> the account for
          <span class="font-bold">{{ userToToggle.userName }}</span>?
          <br />They will instantly lose access to the system.
        </p>
        <p class="text-base-content/70 mb-4" *ngIf="isLocked(userToToggle)">
          Are you sure you want to <strong>unlock</strong> the account for
          <span class="font-bold">{{ userToToggle.userName }}</span>?
          <br />They will be able to log in again.
        </p>

        <div class="flex w-full gap-3">
          <button class="btn btn-ghost flex-1" type="button" (click)="closeConfirmModal()" [disabled]="isLoadingToggle">Cancel</button>
          <button class="btn flex-1 text-white" [ngClass]="isLocked(userToToggle) ? 'btn-success' : 'btn-error'" type="button" (click)="confirmToggle()" [disabled]="isLoadingToggle">
            <ng-container *ngIf="isLoadingToggle">
              <span class="loading loading-spinner loading-sm mr-2"></span>
              Processing...
            </ng-container>
            <ng-container *ngIf="!isLoadingToggle">
              <svg *ngIf="isLocked(userToToggle)" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <svg *ngIf="!isLocked(userToToggle)" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {{ isLocked(userToToggle) ? 'Unlock User' : 'Lock User' }}
            </ng-container>
          </button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit" aria-label="Close dialog">close</button>
    </form>
  </dialog>

  <dialog id="user-delete-confirm-modal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box">
      <form method="dialog">
        <button type="submit" aria-label="Close dialog" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <div class="flex flex-col items-center text-center" *ngIf="userToDelete">
        <div class="mb-4">
          <div class="rounded-full p-4 bg-error/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>

        <h3 class="font-bold text-lg mb-2 text-error">Confirm Permanent Deletion</h3>

        <p class="text-base-content/70 mb-4">
          Are you sure you want to <strong class="text-error">permanently delete</strong> the user
          <span class="font-bold">{{ userToDelete.userName }}</span>?
        </p>

        <div class="alert alert-warning mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="text-sm">This action cannot be undone! All user data, roles, and claims will be permanently removed.</span>
        </div>

        <div class="flex w-full gap-3">
          <button class="btn btn-ghost flex-1" type="button" (click)="closeDeleteConfirmModal()" [disabled]="isLoadingDelete">Cancel</button>
          <button class="btn btn-error flex-1 text-white" type="button" (click)="confirmDelete()" [disabled]="isLoadingDelete">
            <ng-container *ngIf="isLoadingDelete">
              <span class="loading loading-spinner loading-sm mr-2"></span>
              Deleting...
            </ng-container>
            <ng-container *ngIf="!isLoadingDelete">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Permanently
            </ng-container>
          </button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit" aria-label="Close dialog">close</button>
    </form>
  </dialog>

  <!-- Create User Modal -->
  <dialog id="create-user-modal" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-2xl">
      <form method="dialog">
        <button type="submit" aria-label="Close dialog" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      </form>
      <h3 class="font-bold text-lg mb-4">Create New User</h3>

      <form #createUserForm="ngForm" class="space-y-4" (ngSubmit)="createUser()">
        <div class="form-control w-full relative z-30">
          <label class="label">
            <span class="label-text font-semibold">Username <span class="text-error">*</span></span>
          </label>
          <input
            type="text"
            [(ngModel)]="newUser.userName"
            name="userName"
            required
            placeholder="e.g. jsmith"
            class="input input-bordered w-full"
            pattern="^[a-zA-Z0-9]+$"
            #userNameInput="ngModel"
          />
          <label class="label">
            <span class="label-text-alt text-error" *ngIf="userNameInput.invalid && (userNameInput.dirty || userNameInput.touched)">
              Username can only contain letters and digits (no spaces or special characters).
            </span>
          </label>
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">Full Name <span class="text-error">*</span></span>
          </label>
          <input
            type="text"
            [(ngModel)]="newUser.fullName"
            name="fullName"
            required
            placeholder="John Smith"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">Email Address <span class="text-error">*</span></span>
          </label>
          <input
            type="email"
            [(ngModel)]="newUser.email"
            name="email"
            required
            placeholder="user@example.com"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">Password <span class="text-error">*</span></span>
          </label>
          <input
            type="password"
            [(ngModel)]="newUser.password"
            name="password"
            required
            placeholder="Min. 6 characters"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control w-full">
          <label class="label">
            <span class="label-text font-semibold">Roles</span>
          </label>
          <div class="relative w-full">
            <div class="max-h-28 overflow-y-auto pr-1 mb-2">
              <div class="flex flex-wrap gap-2">
              <span *ngFor="let role of newUser.roles" class="badge badge-primary badge-lg gap-1">
                {{ role }}
                <button type="button" class="btn btn-xs btn-circle btn-ghost ml-1" (click)="removeCreateRole(role)">✕</button>
              </span>
              </div>
            </div>
            <input
              type="text"
              [(ngModel)]="newUser.roleInput"
              name="createRoleInput"
              autocomplete="off"
              (input)="filterCreateRoleSuggestions()"
              (keydown.enter)="$event.preventDefault(); addCreateRole(newUser.roleInput)"
              class="input input-bordered w-full"
              placeholder="Type to search roles..."
            />
            <ul *ngIf="filteredCreateRoleSuggestions.length > 0 && newUser.roleInput" class="absolute left-0 right-0 bottom-full mb-1 z-[100] bg-base-100 rounded shadow-lg border border-base-200 max-h-44 overflow-y-auto">
              <li *ngFor="let suggestion of filteredCreateRoleSuggestions" class="px-3 py-2 cursor-pointer hover:bg-base-200" (mousedown)="selectCreateRoleSuggestion(suggestion)">
                {{ suggestion }}
              </li>
            </ul>
          </div>
          <label class="label">
            <span class="label-text-alt">Select one or more roles from the suggestions.</span>
          </label>
        </div>

        <div class="modal-action relative z-10">
          <button type="button" class="btn btn-ghost" (click)="closeCreateUserModal()">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!createUserForm.form.valid || !newUser.userName || !newUser.fullName || !newUser.email || !newUser.password || isLoadingCreate"
          >
            <ng-container *ngIf="isLoadingCreate">
              <span class="loading loading-spinner loading-sm mr-2"></span>
              Creating...
            </ng-container>
            <ng-container *ngIf="!isLoadingCreate">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create User
            </ng-container>
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit" aria-label="Close dialog">close</button>
    </form>
  </dialog>
</div>
`;

const USER_MANAGEMENT_STYLES = `
.table thead th {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: hsl(var(--bc) / 0.8) !important;
}

.table tbody tr td {
  color: hsl(var(--bc)) !important;
}

.table tbody tr td * {
  color: inherit !important;
}

.table tbody tr td svg {
  color: inherit !important;
}

.table thead th,
.table tbody tr td,
.table tbody tr td div,
.table tbody tr td span {
  color: inherit !important;
}

.btn-square {
  transition: all 0.2s ease;
}

.btn-square.btn-outline {
  border-width: 1.5px;
}

.avatar .mask-squircle {
  overflow: hidden;
  border-radius: 8px;
}

.modal-box {
  max-width: 32rem;
}

`;

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
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
      this.isLoadingToggle = true;
      this.userService.toggleUserStatus(this.userToToggle.id).pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isLoadingToggle = false; this.cdr.detectChanges(); })
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
      this.isLoadingDelete = true;
      this.userService.deleteUser(this.userToDelete.id).pipe(
        takeUntil(this.destroy$),
        finalize(() => { this.isLoadingDelete = false; this.cdr.detectChanges(); })
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
