using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using SchoolAPI.Constant;
using SchoolAPI.Application.Features.Brands.Create;
using SchoolAPI.Application.Features.Brands.Delete;
using SchoolAPI.Application.Features.Brands.GetAll;
using SchoolAPI.Application.Features.Brands.GetById;
using SchoolAPI.Application.Features.Brands.Update;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = Permissions.BrandRead)]
public class BrandController : ControllerBase
{
    private readonly ISender _sender;

    public BrandController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAllBrandsQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetBrandByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.BrandCreate)]
    public async Task<IActionResult> Create([FromBody] BrandDto brand, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateBrandCommand(brand), cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result.ErrorMessage);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result.Data);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = Permissions.BrandUpdate)]
    public async Task<IActionResult> Update(string id, [FromBody] BrandDto input, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(input.Id) && !string.Equals(id, input.Id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid brand ID or mismatched ID in request body.");
        }

        var result = await _sender.Send(new UpdateBrandCommand(id, input), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = Permissions.BrandDelete)]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteBrandCommand(id), cancellationToken);
        return result.IsSuccess ? Ok("Brand deleted successfully.") : NotFound(result.ErrorMessage);
    }
}