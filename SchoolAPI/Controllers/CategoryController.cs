using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using SchoolAPI.Constant;
using SchoolAPI.Application.Features.Categories.Create;
using SchoolAPI.Application.Features.Categories.Delete;
using SchoolAPI.Application.Features.Categories.GetAll;
using SchoolAPI.Application.Features.Categories.GetById;
using SchoolAPI.Application.Features.Categories.Update;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = Permissions.CategoryRead)]
public class CategoryController : ControllerBase
{
    private readonly ISender _sender;

    public CategoryController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAllCategoriesQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetCategoryByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.CategoryCreate)]
    public async Task<IActionResult> Create([FromBody] CategoryDto category, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateCategoryCommand(category), cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result.ErrorMessage);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result.Data);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = Permissions.CategoryUpdate)]
    public async Task<IActionResult> Update(string id, [FromBody] CategoryDto input, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(input.Id) && !string.Equals(id, input.Id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid category ID or mismatched ID in request body.");
        }

        var result = await _sender.Send(new UpdateCategoryCommand(id, input), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = Permissions.CategoryDelete)]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteCategoryCommand(id), cancellationToken);
        return result.IsSuccess ? Ok("Category deleted successfully.") : NotFound(result.ErrorMessage);
    }
}