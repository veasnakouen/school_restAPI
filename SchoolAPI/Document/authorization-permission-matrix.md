# Authorization Permission Matrix

This document defines the current permission model used by SchoolAPI.

## Model Summary

- `Admin` is the superuser role and receives every permission.
- `DataEntry` manages master data and inventory operations.
- `Teacher` manages academic operations.
- `User` is an authenticated application user with no broad management permissions by default.
- Self-profile endpoints (`GET /api/auth/profile`, `PUT /api/auth/update-profile`) require authentication only and do not depend on a management permission.

## Permission Naming Pattern

Permissions follow the pattern `<entity>.<action>`.

Examples:

- `brand.read`
- `brand.create`
- `student.update`
- `transaction.delete`

## Permission Matrix

| Role | Permissions |
|---|---|
| Admin | All permissions |
| DataEntry | `brand.read`, `brand.create`, `brand.update`, `brand.delete`, `category.read`, `category.create`, `category.update`, `category.delete`, `department.read`, `department.create`, `department.update`, `department.delete`, `donor.read`, `donor.create`, `donor.update`, `donor.delete`, `responser.read`, `responser.create`, `responser.update`, `responser.delete`, `product.read`, `product.create`, `product.update`, `product.delete`, `transaction.read`, `transaction.create`, `transaction.update`, `transaction.delete` |
| Teacher | `class.read`, `class.create`, `class.update`, `class.delete`, `student.read`, `student.create`, `student.update`, `student.delete`, `outreach.read`, `outreach.create`, `outreach.update`, `outreach.delete`, `enrollment.read`, `enrollment.create`, `enrollment.update`, `enrollment.delete` |
| User | No explicit management permissions |

## Endpoint Mapping

### Users

- `GET /api/auth/users` -> `users.read`
- `GET /api/auth/{id}` -> `users.read`
- `GET /api/auth/details` -> `users.read`
- `GET /api/auth/profile` -> authenticated only
- `PUT /api/auth/update-profile` -> authenticated only

### Roles

- `GET /api/roles` -> `roles.read`
- `POST /api/roles` -> `roles.create`
- `DELETE /api/roles` -> `roles.delete`
- `POST /api/roles/AddUserToRole` -> `roles.assign`
- `POST /api/roles/RemoveUserFromRole` -> `roles.assign`
- `GET /api/roles/{roleName}/permissions` -> `roles.read`
- `POST /api/roles/{roleName}/permissions` -> `roles.update`
- `DELETE /api/roles/{roleName}/permissions` -> `roles.update`

### Master Data

Each master-data controller uses its entity permission pair:

- Brand -> `brand.*`
- Category -> `category.*`
- Department -> `department.*`
- Donor -> `donor.*`
- Responser -> `responser.*`

### Inventory

- Product -> `product.*`
- Transaction -> `transaction.*`

### Academics

- Class -> `class.*`
- Student -> `student.*`
- Outreach -> `outreach.*`
- Enrollment -> `enrollment.*`

## Notes

- Admin bypass is handled centrally by the authorization handler.
- Policies are resolved dynamically from the permission catalog, so adding a new permission only requires defining it once and applying it to the relevant controller action.