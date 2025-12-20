using System.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Data;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly UserManager<AppUser> _userManager;
    private readonly SchoolDbContext _context;
    private readonly ILogger<RolesController> _logger;
    public RolesController(RoleManager<IdentityRole> roleManager, UserManager<AppUser> userManager, ILogger<RolesController> logger, SchoolDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest createRoleRequest)
    {
        if (!ModelState.IsValid) throw new ArgumentOutOfRangeException("input error, Please check your input!.");

        if (string.IsNullOrEmpty(createRoleRequest.RoleName))
        {
            return BadRequest("Role name is required!");
        }

        // role existed
        var roleExist = await _roleManager.RoleExistsAsync(createRoleRequest.RoleName);
        if (roleExist)
        {
            return BadRequest("Role already existed!.");
        }

        if (!roleExist)
        {
            var roleResult = await _roleManager.CreateAsync(new IdentityRole(createRoleRequest.RoleName));
            if (roleResult.Succeeded)
            {
                _logger.LogInformation($"The role {createRoleRequest.RoleName} Has been added successfully");
                // yield return Ok(new
                return Ok(new
                {
                    result = $"The role {createRoleRequest.RoleName} Has been added successfully",
                    // message = "Role Created Successfully!."
                });
            }
            else
            {
                _logger.LogInformation($"The role {createRoleRequest.RoleName} Has not been added successfully");
                return Ok(new
                {
                    error = $"The role {createRoleRequest.RoleName} Has not been added successfully",
                    // message = "Role has not Created Successfully!."
                });
            }
        }
        return BadRequest(new { error = "Role already existed!." });
    }

    [HttpGet("all_roles")]
    public async Task<IActionResult> GetAllRoles()
    {
        return Ok(await _roleManager.Roles.ToListAsync());


        // var roles = await _roleManager.Roles.Where(r => r.Name != "Admin").Select(r => new RoleResponse
        // {
        //     Id = r.Id,
        //     Name = r.Name
        // }).ToListAsync();
        // var roles = await _roleManager.Roles.Select(r => new RoleResponse
        // {
        //     Id = r.Id,
        //     Name = r.Name
        // }).ToListAsync();
        // return Ok(roles);

    }


    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoleResponse>>> GetRoles()
    {

        var roleUserCounts = await _context.UserRoles
           .GroupBy(ur => ur.RoleId)
           .Select(g => new { RoleId = g.Key, UserCount = g.Count() })
           .ToDictionaryAsync(x => x.RoleId, x => x.UserCount);

        var roles = await _roleManager.Roles.Select(r => new RoleResponse
        {
            Id = r.Id,
            Name = r.Name,
            TotalUsers = roleUserCounts.ContainsKey(r.Id) ? roleUserCounts[r.Id] : 0
        }).ToListAsync();

        return Ok(roles);

        // // list of user with total user count
        // var userCount = (await _userManager.Users.ToListAsync()).Count;

        // var roles = await _roleManager.Roles.Select(r => new RoleResponse
        // {
        //     Id = r.Id,
        //     Name = r.Name,
        //     TotalUsers = userCount
        // }).ToListAsync();
        // return Ok(roles);
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteRole(string id)
    {
        var role = await _roleManager.FindByIdAsync(id);

        if (role is null)
            NotFound("Role not found!.");

        var result = await _roleManager.DeleteAsync(role);

        if (result.Succeeded)
            Ok(new { message = "Role delete successfully!" });

        return BadRequest("Role deletion failed");



    }


}