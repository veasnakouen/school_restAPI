using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Constant;
using SchoolAPI.Entities;
using System.Security.Claims;

namespace SchoolAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly RoleManager<AppRole> _roleManager;

    public RolesController(RoleManager<AppRole> roleManager)
    {
        _roleManager = roleManager;
    }

    [HttpGet("all_roles")]
    public async Task<IActionResult> GetAllRoles()
    {
        var roles = await _roleManager.Roles
            // Force explicit lowercase property names so React maps them correctly!
            .Select(r => new { id = r.Id, name = r.Name })
            .ToListAsync();
        return Ok(roles);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoleDetails(string id)
    {
        try
        {
            var role = await _roleManager.FindByIdAsync(id);
            
            // Fallback: If the frontend accidentally sends the role Name instead of the ID
            if (role == null) role = await _roleManager.FindByNameAsync(id);
            
            if (role == null) return NotFound(new { title = "Role not found." });

            var claims = await _roleManager.GetClaimsAsync(role);
            var permissions = claims
                .Where(c => c.Type == Permissions.ClaimType)
                .Select(c => c.Value)
                .ToList();

            return Ok(new { id = role.Id, name = role.Name, permissions = permissions });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { title = "Server error: " + ex.Message });
        }
    }

    public class RoleDto
    {
        public string Name { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new();
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] RoleDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { title = "Role name is required." });

        if (await _roleManager.RoleExistsAsync(request.Name))
            return BadRequest(new { title = "Role already exists." });

        var role = new AppRole { Name = request.Name };
        var result = await _roleManager.CreateAsync(role);

        if (!result.Succeeded)
            return BadRequest(new { title = "Failed to create role.", errors = result.Errors.Select(e => e.Description) });

        foreach (var permission in request.Permissions)
        {
            await _roleManager.AddClaimAsync(role, new Claim(Permissions.ClaimType, permission));
        }

        return Ok(new { message = "Role created successfully." });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRole(string id, [FromBody] RoleDto request)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role == null) return NotFound(new { title = "Role not found." });

        role.Name = request.Name;
        var result = await _roleManager.UpdateAsync(role);

        if (!result.Succeeded)
            return BadRequest(new { title = "Failed to update role.", errors = result.Errors.Select(e => e.Description) });

        // 1. Get existing permissions
        var existingClaims = await _roleManager.GetClaimsAsync(role);
        var existingPermissions = existingClaims.Where(c => c.Type == Permissions.ClaimType).ToList();

        // 2. Figure out what to add and what to remove
        var permissionsToRemove = existingPermissions.Where(c => !request.Permissions.Contains(c.Value)).ToList();
        var permissionsToAdd = request.Permissions.Where(p => !existingPermissions.Any(c => c.Value == p)).ToList();

        // 3. Apply changes to database
        foreach (var claim in permissionsToRemove)
            await _roleManager.RemoveClaimAsync(role, claim);

        foreach (var permission in permissionsToAdd)
            await _roleManager.AddClaimAsync(role, new Claim(Permissions.ClaimType, permission));

        return Ok(new { message = "Role updated successfully." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(string id)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role == null) return NotFound(new { title = "Role not found." });

        // Prevent deleting essential system roles
        if (role.Name == "Admin" || role.Name == "User")
            return BadRequest(new { title = "Cannot delete core system roles." });

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
            return BadRequest(new { title = "Failed to delete role.", errors = result.Errors.Select(e => e.Description) });

        return Ok(new { message = "Role deleted successfully." });
    }
}