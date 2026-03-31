using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Constant;
using SchoolAPI.Contracts.Auth;
using SchoolAPI.Data;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Admin)]
public class RolesController : ControllerBase
{
    private readonly RoleManager<AppRole> _roleManager;
    private readonly UserManager<AppUser> _userManager;
    private readonly SchoolDbContext _context;
    private readonly ILogger<RolesController> _logger;
    public RolesController(RoleManager<AppRole> roleManager, UserManager<AppUser> userManager, ILogger<RolesController> logger, SchoolDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest createRoleRequest)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (string.IsNullOrEmpty(createRoleRequest.RoleName))
        {
            return BadRequest("Role name is required!");
        }

        var roleExist = await _roleManager.RoleExistsAsync(createRoleRequest.RoleName);
        // role existed
        if (roleExist)
        {
            return BadRequest("Role already existed!.");
        }

        if (!roleExist) //check on the role exist status
        {
            var roleResult = await _roleManager.CreateAsync(new AppRole { Name = createRoleRequest.RoleName });
            // check if the role has been added successfully
            if (roleResult.Succeeded)
            {
                _logger.LogInformation("The role {RoleName} was added successfully", createRoleRequest.RoleName);

                return Ok(new
                {
                    result = $"The role {createRoleRequest.RoleName} Has been added successfully"
                });
            }
            else
            {
                _logger.LogInformation("The role {RoleName} was not added successfully", createRoleRequest.RoleName);
                return BadRequest(new
                {
                    error = $"The role {createRoleRequest.RoleName} Has not been added!."
                });
            }
        }
        return BadRequest(new { error = "Role already existed!." });
    }

    [HttpPost("AddUserToRole")]
    public async Task<IActionResult> AddUserToRole(string email, string roleName)
    {
        //check if user exist
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            _logger.LogInformation("The user {Email} does not exist", email);
            return BadRequest(new
            {
                error = "User does not exist."
            });
        }

        //check if role exist
        var roleExist = await _roleManager.RoleExistsAsync(roleName);
        if (!roleExist)
        {
            _logger.LogInformation("The role {RoleName} does not exist", roleName);
            return BadRequest(new
            {
                error = "Role does not exist."
            });
        }
        var result = await _userManager.AddToRoleAsync(user, roleName);
        // check if the user is assign to the role successfully
        if (result.Succeeded)
        {
            return Ok(new
            {
                result = "Success!."
            });
        }
        else
        {
            _logger.LogInformation("The user {Email} could not be added to role {RoleName}", email, roleName);
            return BadRequest(new
            {
                error = "The user was not be able to add to role."
            });
        }
    }

    // [HttpGet("GetUserRole")]
    [HttpGet]
    [Route("GetUserRole")]
    public async Task<IActionResult> GetUserRoles(string email)
    {
        //check if email valid
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            _logger.LogInformation("The user with email {Email} does not exist", email);
            return BadRequest(new
            {
                error = "User does not exist!."
            });
        }

        //return the role
        var roles = await _userManager.GetRolesAsync(user);
        return Ok(roles);
    }

    [HttpPost("RemoveUserFromRole")]
    public async Task<IActionResult> RemoveUserFromRole(string email, string roleName)
    {
        // user exist
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)// User does not exist
        {
            _logger.LogInformation("The user with email {Email} does not exist", email);
            return BadRequest(new
            {
                error = "User does not exist."
            });
        }
        // role exist
        var roleExisted = await _roleManager.RoleExistsAsync(roleName);
        if (!roleExisted)//checks on the role exist status
        {
            _logger.LogInformation($"");
            return BadRequest(new
            {
                error = "Role does not exist!."
            });
        }
        var result = await _userManager.RemoveFromRoleAsync(user, roleName);
        if (result.Succeeded)
        {
            return Ok(new
            {
                result = $"User {email} has been removed from role {roleName}"
            });
        }
        return BadRequest(new
        {
            error = $"Unable to remove user{email} from role {roleName}."
        });
    }


    [HttpGet("all_roles")]
    public async Task<IActionResult> GetAllRoles()
    {
        return Ok(await _roleManager.Roles.ToListAsync());
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
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteRole(string id)
    {
        var role = await _roleManager.FindByIdAsync(id);

        if (role is null)
            return NotFound("Role not found!.");

        var result = await _roleManager.DeleteAsync(role);

        if (result.Succeeded)
            return Ok(new { message = "Role deleted successfully!" });

        return BadRequest("Role deletion failed");
    }
}