using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Application.Features.Purchases.Create;
using SchoolAPI.Application.Features.Purchases.Delete;
using SchoolAPI.Application.Features.Purchases.GetAll;
using SchoolAPI.Application.Features.Purchases.GetById;
using SchoolAPI.Application.Features.Purchases.Update;
using SchoolAPI.Constant;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[Route("api/inventory/purchases")]
[ApiController]
[Authorize]
public class PurchasesController : BaseController
{
    private readonly ISender _sender;

    public PurchasesController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    [Authorize(Policy = Permissions.PurchaseCreate)]
    [ProducesResponseType(typeof(PurchaseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePurchase([FromBody] CreatePurchaseRequest request, CancellationToken cancellationToken)
    {
        var command = new CreatePurchaseCommand(request);
        var result = await _sender.Send(command, cancellationToken);

        // Use the logic from HandleResult for a more specific error response on failure
        if (!result.IsSuccess) return HandleResult(result);

        return CreatedAtAction(nameof(GetPurchaseById), new { purchaseId = result.Data!.Id }, result.Data);
    }

    [HttpGet("{purchaseId}")]
    [Authorize(Policy = Permissions.PurchaseRead)]
    [ProducesResponseType(typeof(PurchaseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPurchaseById(string purchaseId, CancellationToken cancellationToken)
    {
        var query = new GetPurchaseByIdQuery(purchaseId);
        var result = await _sender.Send(query, cancellationToken);

        return HandleResult(result);
    }

    [HttpGet]
    [Authorize(Policy = Permissions.PurchaseRead)]
    [ProducesResponseType(typeof(PagedResult<PurchaseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllPurchases(
        [FromQuery] string? filterOn = null, 
        [FromQuery] string? filterQuery = null, 
        [FromQuery] string? sortBy = null, 
        [FromQuery] bool isAscending = true, 
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10, 
        CancellationToken cancellationToken = default)
    {
        var query = new GetAllPurchasesQuery(filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        
        return HandleResult(result);
    }

    [HttpPut("{purchaseId}")]
    [Authorize(Policy = Permissions.PurchaseUpdate)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePurchase(string purchaseId, [FromBody] UpdatePurchaseRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdatePurchaseCommand(purchaseId, request);
        var result = await _sender.Send(command, cancellationToken);

        return HandleResult(result);
    }

    [HttpDelete("{purchaseId}")]
    [Authorize(Policy = Permissions.PurchaseDelete)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePurchase(string purchaseId, CancellationToken cancellationToken)
    {
        var command = new DeletePurchaseCommand(purchaseId);
        var result = await _sender.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return NotFound(new { message = result.ErrorMessage });
        }

        return NoContent();
    }
}