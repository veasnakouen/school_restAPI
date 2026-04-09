import { Component, OnInit } from '@angular/core';
import { UserService } from './user.service';
import { User } from './user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  isEditing = false;
  isCreating = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get rolesString(): string {
    return this.selectedUser?.roles.join(', ') || '';
  }
  set rolesString(value: string) {
    if (this.selectedUser) {
      this.selectedUser.roles = value.split(',').map(r => r.trim()).filter(r => r);
    }
  }

  loadUsers() {
    this.userService.getUsers().subscribe(users => this.users = users);
  }

  startCreate() {
    this.selectedUser = { id: '', username: '', email: '', roles: [] };
    this.isCreating = true;
    this.isEditing = false;
  }

  startEdit(user: User) {
    this.selectedUser = { ...user };
    this.isEditing = true;
    this.isCreating = false;
  }

  cancel() {
    this.selectedUser = null;
    this.isEditing = false;
    this.isCreating = false;
  }

  saveUser() {
    if (!this.selectedUser) return;
    if (this.isCreating) {
      this.userService.createUser(this.selectedUser).subscribe(() => {
        this.loadUsers();
        this.cancel();
      });
    } else if (this.isEditing) {
      this.userService.updateUser(this.selectedUser).subscribe(() => {
        this.loadUsers();
        this.cancel();
      });
    }
  }

  deleteUser(user: User) {
    if (confirm(`Delete user ${user.username}?`)) {
      this.userService.deleteUser(user.id).subscribe(() => this.loadUsers());
    }
  }
}
