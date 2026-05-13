// MIGRATION/SEED INSTRUCTIONS:
// 1. Run: dotnet ef migrations add PermissionSystem
// 2. Run: dotnet ef database update
// 3. In your startup (e.g., Program.cs), call:
//    using (var scope = app.Services.CreateScope())
//    {
//        var db = scope.ServiceProvider.GetRequiredService<SchoolDbContext>();
//        await DbInitializer.SeedPermissionsAsync(db);
//    }
// This will ensure all permissions from Permissions.cs are seeded into the database.
#nullable enable
using System.Security.Claims;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SchoolAPI.Constant;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Contracts.Auth;
using SchoolAPI.Entities;
using SchoolAPI.Services;
using SchoolAPI.Application.Features.Auth.Register;
using SchoolAPI.Application.Features.Auth.ForgotPassword;
using SchoolAPI.Application.Features.Auth.ResetPassword;
using SchoolAPI.Application.Features.Auth.ConfirmEmail;
using SchoolAPI.Application.Features.Auth.ResendConfirmationEmail;
using SchoolAPI.Application.Features.Products.GetAll;
using SchoolAPI.Data;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Interfaces;
using Microsoft.AspNetCore.Http;

namespace SchoolAPI.Controllers;

public class AuthController : BaseController
{
    private const string UserNotFound = "User not found.";

    private readonly SignInManager<AppUser> _signInManager;
    private readonly UserManager<AppUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IMapper _mapper;
    private readonly JwtSettings _jwtSettings;
    private readonly IMediator _mediator;
    private readonly ClassService _classService;
    private readonly RoleManager<AppRole> _roleManager;
    private readonly IPhotoService _photoService;
    private readonly IApplicationDbContext _context;

    public AuthController(
        UserManager<AppUser> userManager,
        ITokenService tokenService,
        SignInManager<AppUser> signInManager,
        IMapper mapper,
        IOptions<JwtSettings> jwtSettings,
        IMediator mediator,
        ClassService classService,
        RoleManager<AppRole> roleManager,
        IPhotoService photoService,
        IApplicationDbContext context)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _signInManager = signInManager;
        _mapper = mapper;
        _jwtSettings = jwtSettings.Value;
        _mediator = mediator;
        _classService = classService;
        _roleManager = roleManager;
        _photoService = photoService;
        _context = context;
    }

    private DateTime GetRefreshTokenExpiryUtc()
    {
        var refreshTokenExpiryInDays = _jwtSettings.RefreshTokenExpiryInDays > 0
            ? _jwtSettings.RefreshTokenExpiryInDays
            : 7;

        return DateTime.UtcNow.AddDays(refreshTokenExpiryInDays);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var command = new RegisterCommand(request.Email, request.Password, request.FullName, request.Roles);
        var result = await _mediator.Send(command);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        var response = new AuthResponse
        {
            AccessToken = result.Data!.AccessToken,
            RefreshToken = result.Data.RefreshToken,
            ExpiresAt = result.Data.ExpiresAt,
            UserId = result.Data.UserId,
            Email = result.Data.Email,
            FullName = result.Data.FullName,
            IsSuccess = true,
            Role = result.Data.Roles.ToList(),
            Message = "User registered successfully."
        };

        return Ok(response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Try to find the user by Email first, and if not found, try by FullName
        var user = await _userManager.FindByEmailAsync(request.Email) 
                ?? await _userManager.FindByNameAsync(request.Email);

        if (user == null)
        {
            // Don't reveal whether user exists or not
            return Unauthorized("Invalid credentials.");
        }

        // Check if user is locked out
        if (await _userManager.IsLockedOutAsync(user))
        {
            // DEV WORKAROUND: Automatically unlock the admin account to regain access
            if (user.Email?.ToLower() == "admin@school.com")
            {
                await _userManager.SetLockoutEndDateAsync(user, null);
            }
            else
            {
                return Unauthorized("Account is locked out. Please try again later.");
            }
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
        {
            await _userManager.AccessFailedAsync(user);
            
            // Check if lockout threshold reached
            if (await _userManager.IsLockedOutAsync(user))
            {
                return Unauthorized("Account is locked out due to too many failed attempts.");
            }
            
            return Unauthorized("Invalid credentials.");
        }

        // Reset access failed count on successful login
        await _userManager.ResetAccessFailedCountAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = await _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Hash the refresh token before storing
        user.RefreshToken = _tokenService.HashRefreshToken(refreshToken);
        user.RefreshTokenExpiryTime = GetRefreshTokenExpiryUtc();
        await _userManager.UpdateAsync(user);

        await _signInManager.SignInAsync(user, isPersistent: false);

        var response = new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes > 0 ? _jwtSettings.ExpiryInMinutes : 120),
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName ?? string.Empty,
            IsSuccess = true,
            Role = roles.ToList(),
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            AccessFailedCount = user.AccessFailedCount,
            ImageUrl = user.ImageUrl
        };

        return Ok(response);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var principal = _tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null) return BadRequest("Invalid access token.");

        var email = principal.FindFirst(ClaimTypes.Email)?.Value
            ?? principal.FindFirst(ClaimTypes.Name)?.Value
            ?? principal.FindFirst("email")?.Value;
        if (email == null) return BadRequest("Invalid token.");

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
            return Unauthorized("Invalid refresh token.");

        // Verify the refresh token using hash comparison
        if (user.RefreshToken == null || !_tokenService.VerifyRefreshToken(user.RefreshToken, request.RefreshToken) ||
            user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return Unauthorized("Invalid or expired refresh token.");

        var roles = await _userManager.GetRolesAsync(user);
        var newAccessToken = await _tokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        // Hash the new refresh token before storing
        user.RefreshToken = _tokenService.HashRefreshToken(newRefreshToken);
        user.RefreshTokenExpiryTime = GetRefreshTokenExpiryUtc();
        await _userManager.UpdateAsync(user);

        var response = new AuthResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes > 0 ? _jwtSettings.ExpiryInMinutes : 120),
            UserId = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName ?? string.Empty,
            IsSuccess = true,
            Role = roles.ToList(),
            ImageUrl = user.ImageUrl
        };

        return Ok(response);
    }

    // Simple DTO for profile updates
    public class UpdateProfileRequest
    {
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(UserNotFound);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized(UserNotFound);

        user.FullName = request.FullName ?? user.FullName;
        user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;
        
        if (!string.IsNullOrWhiteSpace(request.UserName) && user.UserName != request.UserName)
        {
            var existingUser = await _userManager.FindByNameAsync(request.UserName);
            if (existingUser != null && existingUser.Id != user.Id)
                return BadRequest(new { title = "Username is already taken." });
            user.UserName = request.UserName;
        }

        if (!string.IsNullOrWhiteSpace(request.Email) && user.Email != request.Email)
        {
            var existingEmail = await _userManager.FindByEmailAsync(request.Email);
            if (existingEmail != null && existingEmail.Id != user.Id)
                return BadRequest(new { title = "Email is already taken." });
                
            user.Email = request.Email;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(new { title = "Failed to update profile.", errors = result.Errors.Select(e => e.Description) });

        // Return the full, updated user object so the frontend can update its state
        var roles = await _userManager.GetRolesAsync(user);
        var profile = new {
            id = user.Id, 
            userName = user.UserName, 
            fullName = user.FullName, 
            email = user.Email, 
            roles = roles,
            phoneNumber = user.PhoneNumber, 
            phoneNumberConfirmed = user.PhoneNumberConfirmed, 
            accessFailedCount = user.AccessFailedCount,
            lockoutEnd = user.LockoutEnd, 
            imageUrl = user.ImageUrl
        };

        return Ok(profile);
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(UserNotFound);

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized(UserNotFound);

        var roles = await _userManager.GetRolesAsync(user);

        var profile = new
        {
            id = user.Id,
            userName = user.UserName,
            fullName = user.FullName,
            email = user.Email,
            roles = roles,
            phoneNumber = user.PhoneNumber,
            phoneNumberConfirmed = user.PhoneNumberConfirmed,
            accessFailedCount = user.AccessFailedCount,
            lockoutEnd = user.LockoutEnd,
            imageUrl = user.ImageUrl
        };

        return Ok(profile);
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    [HttpPost("profile/change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(UserNotFound);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized(UserNotFound);

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { title = "Failed to change password.", errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { message = "Password changed successfully." });
    }

    [HttpGet("sidebar-summary")]
    [Authorize]
    public async Task<IActionResult> GetSidebarSummary(CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized(UserNotFound);

            var user = await _userManager.FindByIdAsync(userId);
            if (user is null) return Unauthorized(UserNotFound);

            var roles = await _userManager.GetRolesAsync(user);
            var profile = new
            {
                id = user.Id,
                userName = user.UserName,
                fullName = user.FullName,
                email = user.Email,
                roles = roles,
                phoneNumber = user.PhoneNumber,
                phoneNumberConfirmed = user.PhoneNumberConfirmed,
                accessFailedCount = user.AccessFailedCount,
                imageUrl = user.ImageUrl,
                lockoutEnd = user.LockoutEnd
            };

            var classes = await _classService.GetAllClasses(pageNumber: 1, pageSize: 5);
            var students = await _classService.GetAllStudentsAsync(pageNumber: 1, pageSize: 5);
            var products = await _mediator.Send(new GetAllProductsQuery(null, null, null, null,null, true, 1, 5), cancellationToken);

            return Ok(new
            {
                profile,
                classes,
                students,
                products = products.IsSuccess ? products.Data : null,
                errors = new
                {
                    classes = (string?)null,
                    students = (string?)null,
                    products = products.IsSuccess ? null : products.ErrorMessage
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
        }
    }


    /// <summary>
    /// Grants a permission to a role. Only accessible by Admins.
    /// </summary>
    [HttpPost("roles/grant-permission")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GrantPermissionToRole([FromBody] GrantPermissionToRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RoleName) || string.IsNullOrWhiteSpace(request.Permission))
            return BadRequest("RoleName and Permission are required.");

        var role = await _roleManager.FindByNameAsync(request.RoleName);
        if (role == null)
            return NotFound("Role not found");

        // It's better to check against the DB source of truth for permissions
        var permissionExists = await _context.Permissions.AnyAsync(p => p.Name == request.Permission);
        if (!permissionExists)
        {
            return NotFound("Permission not found");
        }

        var existingClaims = await _roleManager.GetClaimsAsync(role);
        if (existingClaims.Any(c => c.Type == Permissions.ClaimType && c.Value == request.Permission))
        {
            return Ok($"Permission '{request.Permission}' already granted to role '{request.RoleName}'.");
        }

        var result = await _roleManager.AddClaimAsync(role, new Claim(Permissions.ClaimType, request.Permission));

        if (!result.Succeeded)
        {
            return StatusCode(500, "Failed to grant permission.");
        }

        return Ok($"Permission '{request.Permission}' granted to role '{request.RoleName}'");
    }

    public class GrantPermissionToRoleRequest
    {
        public string RoleName { get; set; } = string.Empty;
        public string Permission { get; set; } = string.Empty;
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var command = new ForgotPasswordCommand(request.Email);
        var result = await _mediator.Send(command);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        return Ok(new { message = result.Data!.Message, isSuccess = result.Data.IsSuccess, resetToken = result.Data.ResetToken });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var command = new ResetPasswordCommand(request.Email, request.Token, request.NewPassword);
        var result = await _mediator.Send(command);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        return Ok(new { message = result.Data!.Message, isSuccess = result.Data.IsSuccess });
    }

    [HttpGet("confirm-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmEmail([FromQuery] ConfirmEmailRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var command = new ConfirmEmailCommand(request.UserId, request.Token);
        var result = await _mediator.Send(command);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.ErrorMessage, isSuccess = false });
        }

        return Ok(new { message = result.Data!.Message, isSuccess = result.Data.IsSuccess });
    }

    [HttpPost("resend-confirmation-email")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ResendConfirmationEmail([FromBody] ResendConfirmationEmailRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var command = new ResendConfirmationEmailCommand(request.Email);
        var result = await _mediator.Send(command);

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }

        return Ok(new { message = result.Data!.Message, isSuccess = result.Data.IsSuccess, 
            // Remove these in production - only for testing
            userId = result.Data.UserId,
            confirmationToken = result.Data.ConfirmationToken 
        });
    }

    [HttpPost("profile/avatar")]
    [Authorize]
    [ApiExplorerSettings(IgnoreApi = true)]  // Keep this - file upload breaks Swagger
    [Produces("application/json", Type = typeof(object))]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(UserNotFound);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized(UserNotFound);

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { title = "No file uploaded." });
        }

        var uploadResult = await _photoService.UploadPhotoAsync(file);

        if (uploadResult.Error != null || uploadResult.SecureUrl == null)
        {
            return BadRequest(new { title = uploadResult.Error?.Message ?? "Unknown error during image upload." });
        }

        // Delete the old avatar from Cloudinary if it exists
        if (!string.IsNullOrEmpty(user.ImageUrl))
        {
            try
            {
                var urlParts = user.ImageUrl.Split('/');
                var uploadIndex = Array.IndexOf(urlParts, "upload");
                if (uploadIndex != -1)
                {
                    // Cloudinary URLs format: .../upload/v1234567890/folder/filename.jpg
                    var startIndex = urlParts[uploadIndex + 1].StartsWith("v") ? uploadIndex + 2 : uploadIndex + 1;
                    var publicIdWithExt = string.Join("/", urlParts.Skip(startIndex));
                    var publicId = publicIdWithExt.Substring(0, publicIdWithExt.LastIndexOf('.'));
                    
                    await _photoService.DeletePhotoAsync(publicId);
                }
            }
            catch 
            {
                // Ignore parsing errors so we don't break the upload flow if the old URL was malformed or not from Cloudinary
            }
        }

        user.ImageUrl = uploadResult.SecureUrl.ToString();
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            return BadRequest(new { title = "Failed to update user profile with new avatar." });
        }

        return Ok(new { imageUrl = user.ImageUrl });
    }
}
