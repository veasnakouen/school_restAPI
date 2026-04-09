import { Component, OnInit } from '@angular/core';
import { RoleService } from './role.service';
import { Role } from './role.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-management.component.html',
  styleUrls: ['./role-management.component.scss']
})
export class RoleManagementComponent implements OnInit {
  roles: Role[] = [];
  selectedRole: Role | null = null;
  isEditing = false;
  isCreating = false;

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  get permissionsString(): string {
    return this.selectedRole?.permissions.join(', ') || '';
  }
  set permissionsString(value: string) {
    if (this.selectedRole) {
      this.selectedRole.permissions = value.split(',').map(p => p.trim()).filter(p => p);
    }
  }

  loadRoles() {
    this.roleService.getRoles().subscribe(roles => this.roles = roles);
  }

  startCreate() {
    this.selectedRole = { id: '', name: '', permissions: [] };
    this.isCreating = true;
    this.isEditing = false;
  }

  startEdit(role: Role) {
    this.selectedRole = { ...role };
    this.isEditing = true;
    this.isCreating = false;
  }

  cancel() {
    this.selectedRole = null;
    this.isEditing = false;
    this.isCreating = false;
  }

  saveRole() {
    if (!this.selectedRole) return;
    if (this.isCreating) {
      this.roleService.createRole(this.selectedRole).subscribe(() => {
        this.loadRoles();
        this.cancel();
      });
    } else if (this.isEditing) {
      this.roleService.updateRole(this.selectedRole).subscribe(() => {
        this.loadRoles();
        this.cancel();
      });
    }
  }

  deleteRole(role: Role) {
    if (confirm(`Delete role ${role.name}?`)) {
      this.roleService.deleteRole(role.id).subscribe(() => this.loadRoles());
    }
  }
}
