using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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

        return Ok($"Role '{roleName}' assigned to user.");
    }

    [HttpDelete("{userId}/roles/{roleName}")]
    public async Task<IActionResult> RemoveRoleFromUser(string userId, string roleName)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        var result = await _userManager.RemoveFromRoleAsync(user, roleName);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok($"Role '{roleName}' removed from user.");
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
}

public class ClaimDto
{
    public string Type { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}