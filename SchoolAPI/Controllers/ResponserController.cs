using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using SchoolAPI.Constant;
using SchoolAPI.Application.Features.Responsers.Create;
using SchoolAPI.Application.Features.Responsers.Delete;
using SchoolAPI.Application.Features.Responsers.GetAll;
using SchoolAPI.Application.Features.Responsers.GetById;
using SchoolAPI.Application.Features.Responsers.Update;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = Permissions.ResponserRead)]
public class ResponserController : ControllerBase
{
    private readonly ISender _sender;

    public ResponserController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAllResponsersQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetResponserByIdQuery(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.ResponserCreate)]
    public async Task<IActionResult> Create([FromBody] ResponserDto responser, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateResponserCommand(responser), cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result.ErrorMessage);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result.Data);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = Permissions.ResponserUpdate)]
    public async Task<IActionResult> Update(string id, [FromBody] ResponserDto input, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(input.Id) && !string.Equals(id, input.Id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid responser ID or mismatched ID in request body.");
        }

        var result = await _sender.Send(new UpdateResponserCommand(id, input), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = Permissions.ResponserDelete)]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteResponserCommand(id), cancellationToken);
        return result.IsSuccess ? Ok("Responser deleted successfully.") : NotFound(result.ErrorMessage);
    }
}