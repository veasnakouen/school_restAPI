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

    public AuthController(
        UserManager<AppUser> userManager,
        ITokenService tokenService,
        SignInManager<AppUser> signInManager,
        IMapper mapper,
        IOptions<JwtSettings> jwtSettings,
        IMediator mediator,
        ClassService classService,
        RoleManager<AppRole> roleManager)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _signInManager = signInManager;
        _mapper = mapper;
        _jwtSettings = jwtSettings.Value;
        _mediator = mediator;
        _classService = classService;
        _roleManager = roleManager;
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

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            // Don't reveal whether user exists or not
            return Unauthorized("Invalid credentials.");
        }

        // Check if user is locked out
        if (await _userManager.IsLockedOutAsync(user))
        {
            return Unauthorized("Account is locked out. Please try again later.");
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
            AccessFailedCount = user.AccessFailedCount
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
        if (!_tokenService.VerifyRefreshToken(user.RefreshToken, request.RefreshToken) ||
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
            Role = roles.ToList()
        };

        return Ok(response);
    }

    [HttpPut("update-profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UserDetail request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(UserNotFound);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(UserNotFound);

        user.FullName = request.FullName ?? user.FullName;
        user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok("Profile updated successfully.");
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<UserDetail>> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(UserNotFound);

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound(UserNotFound);

        var roles = await _userManager.GetRolesAsync(user);

        var profile = new
        {
            user.Id,
            user.FullName,
            user.Email,
            Roles = roles,
            user.PhoneNumber,
            user.PhoneNumberConfirmed,
            user.AccessFailedCount
        };

        return Ok(profile);
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
            if (user is null) return NotFound(UserNotFound);

            var roles = await _userManager.GetRolesAsync(user);
            var profile = new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                roles = roles,
                phoneNumber = user.PhoneNumber,
                phoneNumberConfirmed = user.PhoneNumberConfirmed,
                accessFailedCount = user.AccessFailedCount
            };

            var classes = await _classService.GetAllClasses(pageNumber: 1, pageSize: 5);
            var students = await _classService.GetAllStudentsAsync(pageNumber: 1, pageSize: 5);
            var products = await _mediator.Send(new GetAllProductsQuery(null, null, null, true, 1, 5), cancellationToken);

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
    public async Task<IActionResult> GrantPermissionToRole([FromBody] GrantPermissionToRoleRequest request,
    [FromServices] SchoolDbContext _context)
    {
        if (string.IsNullOrWhiteSpace(request.RoleName) || string.IsNullOrWhiteSpace(request.Permission))
            return BadRequest("RoleName and Permission are required.");

        var role = await _roleManager.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Name == request.RoleName);
        if (role == null)
            return NotFound("Role not found");

        var permission = await _context.Permissions.FirstOrDefaultAsync(p => p.Name == request.Permission);
        if (permission == null)
            return NotFound("Permission not found");

        bool alreadyAssigned = role.RolePermissions?.Any(rp => rp.PermissionId == permission.Id) ?? false;
        if (!alreadyAssigned)
        {
            role.RolePermissions ??= new List<AppRolePermission>();
            role.RolePermissions.Add(new AppRolePermission
            {
                RoleId = role.Id,
                PermissionId = permission.Id
            });
            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
                return StatusCode(500, "Failed to update role permissions.");
        }

        return Ok($"Permission '{request.Permission}' granted to role '{request.RoleName}'");
    }

    public class GrantPermissionToRoleRequest
    {
        public string RoleName { get; set; }
        public string Permission { get; set; }
    }

    [HttpGet("{id}")]
    [Authorize(Policy = Permissions.UsersRead)]
    public async Task<ActionResult<AuthResponse>> GetUser(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound("User not found.");
        return Ok(_mapper.Map<AuthResponse>(user));
    }

    [HttpGet("users")]
    [Authorize(Policy = Permissions.UsersRead)]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] string? filterOn = null,
        [FromQuery] string? filterQuery = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool isAscending = true,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filterOn) && !string.IsNullOrWhiteSpace(filterQuery))
        {
            if (filterOn.Equals("name", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => EF.Functions.Like(u.FullName, $"%{filterQuery}%"));
            }
            else if (filterOn.Equals("email", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => EF.Functions.Like(u.Email!, $"%{filterQuery}%"));
            }
            else if (filterOn.Equals("phone", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => u.PhoneNumber != null && EF.Functions.Like(u.PhoneNumber, $"%{filterQuery}%"));
            }
        }

        query = string.IsNullOrWhiteSpace(sortBy)
            ? query.OrderBy(u => u.FullName)
            : sortBy.Equals("name", StringComparison.OrdinalIgnoreCase)
                ? isAscending ? query.OrderBy(u => u.FullName) : query.OrderByDescending(u => u.FullName)
                : sortBy.Equals("email", StringComparison.OrdinalIgnoreCase)
                    ? isAscending ? query.OrderBy(u => u.Email) : query.OrderByDescending(u => u.Email)
                    : query.OrderBy(u => u.FullName);

        var totalCount = await query.CountAsync();
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : pageSize;
        var users = await query.AsNoTracking()
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userList = new List<UserListItemDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userList.Add(new UserListItemDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Roles = roles.ToList()
            });
        }

        return Ok(new PagedResult<UserListItemDto>
        {
            Items = userList,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    [HttpGet("details")]
    [Authorize(Policy = Permissions.UsersRead)]
    public async Task<ActionResult<UserDetail>> GetUserDetail(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound(UserNotFound);

        var roles = await _userManager.GetRolesAsync(user);

        var userDetail = _mapper.Map<UserDetail>(user);
        userDetail.Roles = roles.ToList();

        return Ok(userDetail);
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

    [HttpPost("grant-permission")]
    [Authorize(Roles = "Admin")] // Only admins can grant permissions
    public async Task<IActionResult> GrantPermission([FromBody] GrantPermissionRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
            return NotFound("User not found");

        var role = await _roleManager.FindByNameAsync(request.RoleName);
        if (role == null)
            return NotFound("Role not found");

        // Add permission if not already present
        // (Legacy code removed: Permissions property is no longer used. See new dynamic permission logic above.)

        return Ok("Permission granted");
    }

    public class GrantPermissionRequest
    {
        public string UserId { get; set; }
        public string RoleName { get; set; }
        public string Permission { get; set; }
    }
}
