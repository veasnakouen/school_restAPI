using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using SchoolAPI.Constant;
using SchoolAPI.Application.Features.Donors.Create;
using SchoolAPI.Application.Features.Donors.Delete;
using SchoolAPI.Application.Features.Donors.GetAll;
using SchoolAPI.Application.Features.Donors.GetById;
using SchoolAPI.Application.Features.Donors.Update;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Roles.Admin},{Roles.DataEntry}")]
public class DonorController : ControllerBase
{
    private readonly ISender _sender;

    public DonorController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAllDonorsQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetDonorByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DonorDto donor, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateDonorCommand(donor), cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result.ErrorMessage);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result.Data);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] DonorDto input, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(input.Id) && !string.Equals(id, input.Id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid donor ID or mismatched ID in request body.");
        }

        var result = await _sender.Send(new UpdateDonorCommand(id, input), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteDonorCommand(id), cancellationToken);
        return result.IsSuccess ? Ok("Donor deleted successfully.") : NotFound(result.ErrorMessage);
    }
}