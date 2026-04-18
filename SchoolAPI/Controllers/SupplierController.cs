using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SchoolAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SupplierController : ControllerBase
{
    private readonly SchoolDbContext _context;

    public SupplierController(SchoolDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetSuppliers()
    {
        var suppliers = await _context.Suppliers
            .OrderBy(s => s.Name)
            .Select(s => new
            {
                Id = s.Id,
                Name = s.Name
            })
            .ToListAsync();

        return Ok(suppliers);
    }

    public class CreateSupplierRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { title = "Supplier name is required." });

        var existing = await _context.Suppliers
            .FirstOrDefaultAsync(s => EF.Functions.ILike(s.Name, request.Name));

        if (existing != null)
            return BadRequest(new { title = "A supplier with this name already exists." });

        var supplier = new Supplier
        {
            Id =Guid.NewGuid().ToString(),
            Name = request.Name
        };

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            Id = supplier.Id,
            Name = supplier.Name
        });
    }
}