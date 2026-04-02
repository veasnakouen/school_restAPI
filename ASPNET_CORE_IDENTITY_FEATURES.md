# ASP.NET Core Identity Features Added to SchoolAPI

## Overview
This document outlines all the ASP.NET Core Identity features that have been integrated into the SchoolAPI project.

## 1. Entity Configuration

### AppUser Entity (`Entities/AppUser.cs`)
- Inherits from `IdentityUser` (string-based ID)
- Custom properties:
  - `FullName`: User's full name
  - `CreatedAt`: Account creation timestamp
  - `RefreshToken`: For JWT token refresh functionality
  - `RefreshTokenExpiryTime`: Token expiration tracking

### AppRole Entity (`Entities/AppRole.cs`)
- Inherits from `IdentityRole` (string-based ID)
- Navigation property: `UserRoles` collection

### AppUserRole Entity (`Entities/AppUserRole.cs`)
- Inherits from `IdentityUserRole<string>`
- Links users to roles with proper relationships

## 2. Database Context Configuration (`Data/SchoolDbcontext.cs`)

```csharp
public class SchoolDbContext : IdentityDbContext<AppUser, AppRole, string>
```

Configured with:
- Full Identity support with custom entities
- Custom table names: "Users", "Roles", "UserRoles"
- Proper relationship configuration with cascade delete
- All Identity tables: Users, Roles, UserRoles, UserClaims, UserLogins, UserTokens, RoleClaims

## 3. Identity Services Configuration (`Extensions/ServiceCollectionExtensions.cs`)

### Password Settings
- Require digit: `true`
- Require lowercase: `true`
- Require uppercase: `true`
- Require non-alphanumeric: `false`
- Required length: `8` characters
- Required unique chars: `1`

### User Settings
- Require unique email: `true`
- Allowed username characters: Standard alphanumeric + special chars

### SignIn Settings
- Require confirmed email: `false`
- Require confirmed phone: `false`
- Require confirmed account: `false`

### Lockout Settings
- Default lockout time: 5 minutes
- Max failed access attempts: 5
- Allowed for new users: `true`

### Registered Services
- `UserManager<AppUser>`: User management operations
- `RoleManager<AppRole>`: Role management operations
- `SignInManager<AppUser>`: Sign-in operations
- Default token providers for email/phone confirmation and password reset

## 4. Identity API Endpoints (`Program.cs`)

Using `AddIdentityApiEndpoints<AppUser>()` provides these **built-in endpoints**:

### Authentication Endpoints
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh access token

### Email Management
- `POST /confirmEmail` - Confirm email address
- `POST /resendConfirmationEmail` - Resend confirmation
- `POST /forgotPassword` - Request password reset
- `POST /resetPassword` - Reset password with token

### Account Management
- `GET /manage/2fa` - Get 2FA status
- `POST /manage/2fa` - Enable/disable 2FA
- `GET /manage/info` - Get user info
- `PUT /manage/info` - Update user info
- `POST /manage/changePassword` - Change password

### External Login Support
- `POST /externalLogin` - Initiate external login
- `POST /externalLogin/callback` - Handle callback

## 5. Role Management (`Controllers/RolesController.cs`)

Available operations:
- `POST /api/roles` - Create new role
- `GET /api/roles/all_roles` - Get all roles
- `GET /api/roles` - Get roles with user count
- `DELETE /api/roles?id={id}` - Delete role

## 6. User & Authentication Management (`Controllers/AuthController.cs`)

Features implemented:
- User registration with role assignment
- User login with JWT token generation
- Refresh token mechanism
- Profile updates
- Get user profile
- Get all users with filtering
- Get user details by ID
- Role-based authorization

## 7. Data Seeding (`Extensions/WebApplicationExtensions.cs`)

Automatic seeding on application startup:
- Creates default roles: "User" and "Admin"
- Creates admin user: `admin@school.com` / `Admin@123`

## 8. Security Features

### JWT Authentication
- Configured in `AddJwtAuthentication()` method
- Token validation parameters:
  - Validate issuer, audience, lifetime, and signing key
  - Custom error handling for unauthorized requests

### Authorization Policies
- Role-based authorization is still used for Identity membership, but feature access is policy-based.
- Policy-based authorization support with permission policies like `brand.read` and `student.update`
- Claims-based authorization support
- See [authorization-permission-matrix](SchoolAPI/Document/authorization-permission-matrix.md) for the current role-to-permission map.

### Security Headers
Added middleware for:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-Xss-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)

## 9. Identity Tables Structure

The following tables are created in the database:

1. **Users** - User accounts
2. **Roles** - Application roles
3. **UserRoles** - User-Role mappings
4. **UserClaims** - User claims
5. **UserLogins** - External login providers
6. **UserTokens** - Security tokens
7. **RoleClaims** - Role claims

## 10. Usage Examples

### Register a New User
```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe"
}
```

### Login
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Create Role (Admin Only)
```http
POST /api/roles
Content-Type: application/json
Authorization: Bearer {token}

{
  "roleName": "Teacher"
}
```

### Assign Role to User
```csharp
await _userManager.AddToRoleAsync(user, "Teacher");
```

### Check if User is in Role
```csharp
var isInRole = await _userManager.IsInRoleAsync(user, "Admin");
```

### Get Users in Role
```csharp
var users = await _userManager.GetUsersInRoleAsync("Admin");
```

## 11. Complete Feature List

✅ User Registration
✅ User Login/Logout
✅ Password Management (Change, Reset, Forgot)
✅ Email Confirmation
✅ Phone Confirmation (optional)
✅ Two-Factor Authentication (2FA)
✅ Role Management
✅ Claim Management
✅ External Login Providers (Google, Facebook, etc.)
✅ Account Lockout
✅ Password Strength Validation
✅ Token-based Authentication (JWT)
✅ Refresh Tokens
✅ Remember Me Functionality
✅ User Profile Management
✅ Security Stamps
✅ Concurrent Session Management
✅ Audit Logging (AccessFailedCount, LastLockout, etc.)

## Migration Required

After these changes, run the following commands to update the database:

```bash
dotnet ef migrations add AddFullIdentityFeatures
dotnet ef database update
```

## Notes

- The system uses string-based IDs (GUIDs) for users and roles (default Identity behavior)
- All Identity features are production-ready and follow Microsoft best practices
- Custom business logic can be added alongside built-in features
- The Identity API endpoints work seamlessly with Swagger/OpenAPI documentation
