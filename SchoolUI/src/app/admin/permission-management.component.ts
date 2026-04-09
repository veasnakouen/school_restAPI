import { Component, OnInit } from '@angular/core';
import { PermissionService } from './permission.service';
import { Permission } from './permission.model';
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
  permissions: Permission[] = [];
  selectedPermission: Permission | null = null;
  isEditing = false;
  isCreating = false;

  constructor(private permissionService: PermissionService) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions() {
    this.permissionService.getPermissions().subscribe(perms => this.permissions = perms);
  }

  startCreate() {
    this.selectedPermission = { id: '', name: '', description: '' };
    this.isCreating = true;
    this.isEditing = false;
  }

  startEdit(permission: Permission) {
    this.selectedPermission = { ...permission };
    this.isEditing = true;
    this.isCreating = false;
  }

  cancel() {
    this.selectedPermission = null;
    this.isEditing = false;
    this.isCreating = false;
  }

  savePermission() {
    if (!this.selectedPermission) return;
    if (this.isCreating) {
      this.permissionService.createPermission(this.selectedPermission).subscribe(() => {
        this.loadPermissions();
        this.cancel();
      });
    } else if (this.isEditing) {
      this.permissionService.updatePermission(this.selectedPermission).subscribe(() => {
        this.loadPermissions();
        this.cancel();
      });
    }
  }

  deletePermission(permission: Permission) {
    if (confirm(`Delete permission ${permission.name}?`)) {
      this.permissionService.deletePermission(permission.id).subscribe(() => this.loadPermissions());
    }
  }
}
