using MediatR;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Features.Brands.Update;
using SchoolAPI.Application.Features.Brands.Delete;
using SchoolAPI.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Entities;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BrandController : BaseController // Assuming BaseController handles Result<T> wrapping
{
    private readonly ISender _sender;

    public BrandController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllBrands([FromServices] IApplicationDbContext context)
    {
        var brands = await context.Brands.Select(b => new { b.Id, b.Name }).ToListAsync();
        return Ok(brands);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBrand([FromBody] BrandDto request, [FromServices] IApplicationDbContext context)
    {
        var brand = new Brand { Id = Guid.NewGuid().ToString(), Name = request.Name };
        context.Brands.Add(brand);
        await context.SaveChangesAsync(default);
        return Ok(brand);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBrand(string id, [FromBody] BrandDto request)
    {
        return HandleResult(await _sender.Send(new UpdateBrandCommand(id, request)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBrand(string id)
    {
        return HandleResult(await _sender.Send(new DeleteBrandCommand(id)));
    }
}