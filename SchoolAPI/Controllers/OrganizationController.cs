using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class OrganizationController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public OrganizationController(IApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Organization
    [HttpGet]
    [AllowAnonymous] // Allow anonymous so the login page can display the custom App Name/Logo!
    public async Task<IActionResult> GetSettings()
    {
        var org = await _context.Organizations.FirstOrDefaultAsync() ?? new Organization();
        return Ok(org);
    }

    // POST: api/Organization
    [HttpPost]
    public async Task<IActionResult> UpdateSettings([FromBody] Organization updateDto)
    {
        var org = await _context.Organizations.FirstOrDefaultAsync();
        if (org == null)
        {
            org = new Organization { Id = "DEFAULT" };
            _context.Organizations.Add(org);
        }
        
        if (!string.IsNullOrWhiteSpace(updateDto.AppName))
            org.AppName = updateDto.AppName;
            
        if (updateDto.LogoBase64 != null)
            org.LogoBase64 = updateDto.LogoBase64;

        await _context.SaveChangesAsync(default);
        return Ok(org);
    }

    // Specific endpoints to support the Report.tsx PDF generator
    [HttpGet("Logo")]
    public async Task<IActionResult> GetLogo()
    {
        var org = await _context.Organizations.FirstOrDefaultAsync();
        return Ok(new { base64String = org?.LogoBase64 });
    }

    [HttpPost("Logo")]
    public async Task<IActionResult> UpdateLogo([FromBody] Organization updateDto)
    {
        // Reuses the main update logic
        return await UpdateSettings(updateDto);
    }
}