# Code Review - SchoolAPI Errors and Fixes

## Critical Errors to Fix

### 1. **Program.cs - Remove Unused Imports**
**Location:** `/workspace/SchoolAPI/Program.cs` (Lines 1-16)

**Problem:** Many imports reference packages that don't exist or aren't installed.

**Fix:** Replace with only necessary imports:
```csharp
using System.Text;
using Scalar.AspNetCore;
using schoolAPI.Extensions;
using SchoolAPI.Contracts;
using SchoolAPI.Extensions;
using SchoolAPI.Middleware;
using Serilog;
```

### 2. **ServiceExtensions.cs - Wrong Namespace**
**Location:** `/workspace/SchoolAPI/Extensions/ServiceExtensions.cs` (Line 5)

**Problem:** Namespace is `schoolAPI.Extensions` (lowercase 's') but should match project convention.

**Fix:** Change to:
```csharp
namespace SchoolAPI.Extensions;
```

### 3. **BaseController.cs - Wrong Namespace**
**Location:** `/workspace/SchoolAPI/Controllers/BaseController.cs` (Line 3)

**Problem:** Controller is in `SchoolAPI.Entities` namespace instead of `SchoolAPI.Controllers`.

**Fix:** Change to:
```csharp
namespace SchoolAPI.Controllers;
```

### 4. **Duplicate Identity Registration**
**Location:** `Program.cs` and `ServiceCollectionExtensions.cs`

**Problem:** You're calling both `AddIdentityCore()` and `AddIdentityServices()` which register Identity twice.

**Fix in Program.cs:** Remove one of these calls:
```csharp
// Keep only ONE of these:
builder.Services.AddIdentityServices(builder.Configuration); // Recommended
// OR
builder.Services.AddIdentityCore(builder.Configuration);
```

**Recommendation:** Use `AddIdentityServices()` as it's more complete, and remove the call to `ConfigureIdentity()` from ApplicationService.cs.

### 5. **Confusing Token Service Implementation**
**Problem:** Two different token services doing similar things:
- `TokenService` (uses JwtSettings, generates access + refresh tokens)
- `TokenServices` (uses TokenKey from appsettings, only generates access tokens)

**Fix:** Choose ONE approach. Recommended: Use `TokenService` with proper JWT configuration and remove `TokenServices`.

In `ServiceCollectionExtensions.cs` line 167, remove:
```csharp
services.AddScoped<ITokenServices, TokenServices>();
```

In `AuthController.cs`, use only `_tokenService` (ITokenService) instead of mixing both.

### 6. **Duplicate Service Registrations in Program.cs**

**Problem:** Multiple redundant calls:
```csharp
builder.Services.AddScoped<ClassService>(); // Line 50
// ... then later ...
builder.Services.AddServices(); // Which also registers ClassService again
```

**Fix:** Remove duplicate registrations. Keep only the extension method calls.

### 7. **CORS Configuration Conflict**
**Location:** `Program.cs` and multiple extension files

**Problem:** CORS is configured multiple times:
- `ApplicationService.ConfigureCors()` 
- `ServiceCollectionExtensions.ConfigureCors()`
- Directly in Program.cs

**Fix:** Use only ONE CORS configuration. Recommended: Keep `ConfigureCors()` in `ServiceCollectionExtensions.cs` and call it once.

### 8. **Missing ITokenService Interface**
**Location:** `/workspace/SchoolAPI/Interfaces/` 

**Problem:** `ITokenService` interface doesn't exist but is referenced in:
- `TokenService.cs` implements `ITokenService`
- `ServiceCollectionExtensions.cs` line 165 registers it

**Fix:** Create the interface file `/workspace/SchoolAPI/Interfaces/ITokenService.cs`:
```csharp
using SchoolAPI.Entities;

namespace SchoolAPI.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(AppUser user, IEnumerable<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
```

### 9. **AppUser Missing Required Property Initialization**
**Location:** `Entities/AppUser.cs`

**Problem:** `RefreshToken` property is not nullable but has no default value:
```csharp
public string RefreshToken { get; set; } // Should be nullable or have default
```

**Fix:** Make it nullable:
```csharp
public string? RefreshToken { get; set; }
```

### 10. **MappingProfile - Invalid Mapping**
**Location:** `RequestHelper/MappingProfile.cs` (Line 14)

**Problem:** This mapping doesn't make sense:
```csharp
CreateMap<AuthResponse, UserManager<AppUser>>().ReverseMap();
```

**Fix:** Remove this line as you can't map to UserManager.

### 11. **LoginRequest - Confusing Properties**
**Location:** `Contracts/Auth/LoginRequest.cs`

**Problem:** LoginRequest has AccessToken and RefreshToken properties which don't belong in a login request.

**Fix:** Remove those properties:
```csharp
public class LoginRequest
{
    [Required(ErrorMessage = "Email is required!")]
    public string Email { get; set; }
    
    [Required(ErrorMessage = "Password is required!")]
    public string Password { get; set; }
}
```

### 12. **Duplicate Code in Program.cs**
**Location:** Lines 247-450+ in Program.cs

**Problem:** Large blocks of commented-out tutorial code (SOLID principles examples) clutter the file.

**Fix:** Move tutorial code to a separate learning/demo project or remove entirely.

## Recommended Clean Program.cs Structure

```csharp
using System.Text;
using Scalar.AspNetCore;
using SchoolAPI.Contracts;
using SchoolAPI.Extensions;
using SchoolAPI.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Logging
var logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

builder.Logging.ClearProviders().AddSerilog(logger).AddConsole().AddDebug();

// Register Services via Extension Methods
builder.Services
    .AddApplicationServices()
    .AddIdentityServices(builder.Configuration)
    .AddJwtAuthentication(builder.Configuration)
    .AddDatabase(builder.Configuration)
    .AddMediatR(builder.Configuration)
    .AddFluentValidation()
    .AddAutoMapper()
    .AddSwagger();

// Configure CORS
builder.Services.ConfigureCors();

var app = builder.Build();

// Middleware
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapScalarApiReference();
    app.MapOpenApi();
}

app.UseCors("CorePolicy");
app.UseHttpsRedirection();
app.UseRouting();
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

// Security Headers
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    ctx.Response.Headers.Append("X-Frame-Options", "DENY");
    ctx.Response.Headers.Append("X-Xss-Protection", "1; mode=block");
    ctx.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000");
    await next();
});

app.MapControllers();
app.MapIdentityApiEndpoints<AppUser>();

// Seed Data (optional)
// using var scope = app.Services.CreateScope();
// await app.SeedDataAsync();

app.Run();
```

## Files That Need Immediate Attention

1. ✅ `/workspace/SchoolAPI/Program.cs` - Clean up imports and structure
2. ✅ `/workspace/SchoolAPI/Extensions/ServiceExtensions.cs` - Fix namespace
3. ✅ `/workspace/SchoolAPI/Controllers/BaseController.cs` - Fix namespace
4. ✅ `/workspace/SchoolAPI/Interfaces/ITokenService.cs` - Create this file
5. ✅ `/workspace/SchoolAPI/Entities/AppUser.cs` - Fix RefreshToken property
6. ✅ `/workspace/SchoolAPI/RequestHelper/MappingProfile.cs` - Remove invalid mapping
7. ✅ `/workspace/SchoolAPI/Contracts/Auth/LoginRequest.cs` - Remove token properties
8. ✅ Choose ONE token service approach and stick with it
9. ✅ Remove duplicate service registrations

## Next Steps

Would you like me to fix these files one by one? I recommend starting with:
1. Fix namespaces first
2. Create missing interfaces
3. Clean up Program.cs
4. Remove duplicate registrations
5. Fix entity models
6. Clean up DTOs
