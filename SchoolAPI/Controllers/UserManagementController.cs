using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Constant;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")] // Protect this controller at the Admin level or use a specific Policy
public class UserManagementController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<AppRole> _roleManager;

    public UserManagementController(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userManager.Users
            .Select(u => new
            {
                u.Id,
                u.UserName,
                u.FullName,
                u.Email,
                u.PhoneNumber,
                u.LockoutEnd
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrEmpty(request.UserName) || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest("UserName, Email, and Password are required.");
        }

        var user = new AppUser
        {
            UserName = request.UserName,
            FullName = request.FullName,
            Email = request.Email,
            CreatedAt = DateTime.UtcNow,
            RefreshToken = "" // Set default value to satisfy NOT NULL constraint
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        // Assign roles if provided
        if (request.Roles != null && request.Roles.Count > 0)
        {
            foreach (var roleName in request.Roles)
            {
                if (await _roleManager.RoleExistsAsync(roleName))
                {
                    await _userManager.AddToRoleAsync(user, roleName);
                }
                else
                {
                    return BadRequest($"Role '{roleName}' does not exist.");
                }
            }
        }
        else
        {
            // Default to 'User' role if no roles provided
            if (await _roleManager.RoleExistsAsync("User"))
            {
                await _userManager.AddToRoleAsync(user, "User");
            }
        }

        return Ok(new
        {
            user.Id,
            user.UserName,
            user.Email,
            Message = "User created successfully."
        });
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateUser(string userId, [FromBody] UpdateUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        // Update username if changed
        if (!string.IsNullOrEmpty(request.UserName) && user.UserName != request.UserName)
        {
            var userNameResult = await _userManager.SetUserNameAsync(user, request.UserName);
            if (!userNameResult.Succeeded)
                return BadRequest(new { message = "Failed to update username", errors = userNameResult.Errors });
        }

        // Update email if changed
        if (!string.IsNullOrEmpty(request.Email) && user.Email != request.Email)
        {
            var emailResult = await _userManager.SetEmailAsync(user, request.Email);
            if (!emailResult.Succeeded)
                return BadRequest(new { message = "Failed to update email", errors = emailResult.Errors });
        }

        // Update full name if changed
        if (!string.IsNullOrEmpty(request.FullName) && user.FullName != request.FullName)
        {
            user.FullName = request.FullName;
        }

        // Update phone number if changed
        if (request.PhoneNumber != null && user.PhoneNumber != request.PhoneNumber)
        {
            var phoneResult = await _userManager.SetPhoneNumberAsync(user, request.PhoneNumber);
            if (!phoneResult.Succeeded)
                return BadRequest(new { message = "Failed to update phone number", errors = phoneResult.Errors });
        }

        // Update password if provided
        if (!string.IsNullOrEmpty(request.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var passwordResult = await _userManager.ResetPasswordAsync(user, token, request.Password);
            if (!passwordResult.Succeeded)
                return BadRequest(new { message = "Failed to update password", errors = passwordResult.Errors.Select(e => e.Description) });
        }

        // Save FullName changes if any
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { message = "Failed to update user", errors = updateResult.Errors });
        }

        // If roles were provided, synchronize the user's roles
        if (request.Roles != null)
        {
            var currentRoles = (await _userManager.GetRolesAsync(user)).ToList();

            var rolesToAdd = request.Roles.Except(currentRoles).ToList();
            var rolesToRemove = currentRoles.Except(request.Roles).ToList();

            // Validate roles to add exist
            foreach (var role in rolesToAdd)
            {
                if (!await _roleManager.RoleExistsAsync(role))
                    return BadRequest($"Role '{role}' does not exist.");
            }

            if (rolesToAdd.Count > 0)
            {
                var addResult = await _userManager.AddToRolesAsync(user, rolesToAdd);
                if (!addResult.Succeeded) return BadRequest(addResult.Errors);
            }

            if (rolesToRemove.Count > 0)
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
                if (!removeResult.Succeeded) return BadRequest(removeResult.Errors);
            }
        }

        return Ok(new
        {
            user.Id,
            user.UserName,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            Message = "User updated successfully."
        });
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUserById(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Id,
            user.UserName,
            user.Email,
            user.FullName,
            user.PhoneNumber,
            user.LockoutEnd,
            user.CreatedAt,
            Roles = roles
        });
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        // Prevent deleting yourself (the current logged-in user)
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserId == userId)
        {
            return BadRequest("You cannot delete your own account.");
        }

        // Remove all roles
        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Count > 0)
        {
            await _userManager.RemoveFromRolesAsync(user, roles);
        }

        // Remove all claims
        var claims = await _userManager.GetClaimsAsync(user);
        if (claims.Count > 0)
        {
            await _userManager.RemoveClaimsAsync(user, claims);
        }

        // Delete the user permanently
        var deleteResult = await _userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded)
        {
            return BadRequest(new { message = "Failed to delete user", errors = deleteResult.Errors.Select(e => e.Description) });
        }

        return Ok(new { Message = $"User '{user.UserName}' has been permanently deleted." });
    }

    [HttpPost("{userId}/toggle-status")]
    public async Task<IActionResult> ToggleUserStatus(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        // If the user is currently locked out, unlock them. Otherwise, lock them out for 100 years.
        if (user.LockoutEnd != null && user.LockoutEnd > DateTimeOffset.UtcNow)
        {
            user.LockoutEnd = null;
        }
        else
        {
            user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { Message = user.LockoutEnd == null ? "User unlocked." : "User locked." });
    }

    [HttpGet("{userId}/roles-and-claims")]
    public async Task<IActionResult> GetUserRolesAndClaims(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        var roles = await _userManager.GetRolesAsync(user);
        var claims = await _userManager.GetClaimsAsync(user);

        return Ok(new
        {
            UserId = user.Id,
            Roles = roles,
            Claims = claims.Select(c => new { c.Type, c.Value })
        });
    }

    [HttpPost("{userId}/roles")]
    public async Task<IActionResult> AssignRoleToUser(string userId, [FromBody] string roleName)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        if (!await _roleManager.RoleExistsAsync(roleName))
            return BadRequest($"Role '{roleName}' does not exist.");

        var result = await _userManager.AddToRoleAsync(user, roleName);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { message = $"Role '{roleName}' assigned to user." });
    }

    [HttpDelete("{userId}/roles/{roleName}")]
    public async Task<IActionResult> RemoveRoleFromUser(string userId, string roleName)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        var result = await _userManager.RemoveFromRoleAsync(user, roleName);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { message = $"Role '{roleName}' removed from user." });
    }

    [HttpPost("{userId}/claims")]
    public async Task<IActionResult> AddClaimToUser(string userId, [FromBody] ClaimDto request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        var claim = new Claim(request.Type, request.Value);
        var result = await _userManager.AddClaimAsync(user, claim);
        
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok("Claim added successfully.");
    }

    [HttpDelete("{userId}/claims")]
    public async Task<IActionResult> RemoveClaimFromUser(string userId, [FromBody] ClaimDto request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        // Find the exact claim to remove
        var claims = await _userManager.GetClaimsAsync(user);
        var claimToRemove = claims.FirstOrDefault(c => c.Type == request.Type && c.Value == request.Value);
        
        if (claimToRemove == null) return NotFound("Claim not found on user.");

        var result = await _userManager.RemoveClaimAsync(user, claimToRemove);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok("Claim removed successfully.");
    }

    [HttpPost("{userId}/reset-password")]
    public async Task<IActionResult> ResetPassword(string userId, [FromBody] ResetUserPasswordRequest request)
    {
        if (request == null || string.IsNullOrEmpty(request.NewPassword))
            return BadRequest("NewPassword is required.");

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { Message = "Password reset successfully." });
    }
}

public class ClaimDto
{
    public string Type { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class CreateUserRequest
{
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public List<string>? Roles { get; set; }
}

public class UpdateUserRequest
{
    public string? UserName { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Password { get; set; }
    public List<string>? Roles { get; set; }
}

public class ResetUserPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}