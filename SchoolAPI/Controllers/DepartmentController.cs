using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using SchoolAPI.Constant;
using SchoolAPI.Application.Features.Departments.Create;
using SchoolAPI.Application.Features.Departments.Delete;
using SchoolAPI.Application.Features.Departments.GetAll;
using SchoolAPI.Application.Features.Departments.GetById;
using SchoolAPI.Application.Features.Departments.Update;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.Admin},{Roles.DataEntry}")]
public class DepartmentController : ControllerBase
{
    private readonly ISender _sender;

    public DepartmentController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAllDepartmentsQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetDepartmentByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DepartmentDto department, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateDepartmentCommand(department), cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result.ErrorMessage);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result.Data);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] DepartmentDto input, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(input.Id) && !string.Equals(id, input.Id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid department ID or mismatched ID in request body.");
        }

        var result = await _sender.Send(new UpdateDepartmentCommand(id, input), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteDepartmentCommand(id), cancellationToken);
        return result.IsSuccess ? Ok("Department deleted successfully.") : NotFound(result.ErrorMessage);
    }
}