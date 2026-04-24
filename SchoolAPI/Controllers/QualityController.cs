using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Data;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class QualityController : ControllerBase
{
    private readonly SchoolDbContext _context;

    public QualityController(SchoolDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var qualities = await _context.Qualities.Select(q => new { q.Id, q.Name }).ToListAsync();
        return Ok(qualities);
    }

    public class QualityDtoRequest { public string Name { get; set; } = string.Empty; }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QualityDtoRequest request)
    {
        var quality = new Quality { Id = Guid.NewGuid().ToString(), Name = request.Name };
        _context.Qualities.Add(quality);
        await _context.SaveChangesAsync();
        return Ok(new { quality.Id, quality.Name });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] QualityDtoRequest request)
    {
        var quality = await _context.Qualities.FindAsync(id);
        if (quality == null) return NotFound(new { message = "Quality not found." });
        quality.Name = request.Name;
        await _context.SaveChangesAsync();
        return Ok(new { quality.Id, quality.Name });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var quality = await _context.Qualities.FindAsync(id);
        if (quality == null) return NotFound(new { message = "Quality not found." });
        _context.Qualities.Remove(quality);
        
        try
        {
            await _context.SaveChangesAsync();
            return Ok(new { message = "Quality deleted successfully." });
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { message = "Cannot delete this item because it is currently in use by other records (e.g., assigned to a product)." });
        }
    }
}