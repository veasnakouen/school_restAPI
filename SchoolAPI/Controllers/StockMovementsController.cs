using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Application.Features.StockMovements.GetAll;

namespace SchoolAPI.Controllers;

[Route("api/inventory/stock-movements")]
[ApiController]
[Authorize] 
public class StockMovementsController : BaseController
{
    private readonly ISender _sender;

    public StockMovementsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<StockMovementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllStockMovements(
        [FromQuery] string? filterOn = null, 
        [FromQuery] string? filterQuery = null, 
        [FromQuery] string? sortBy = null, 
        [FromQuery] bool isAscending = true, 
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10, 
        CancellationToken cancellationToken = default)
    {
        var query = new GetAllStockMovementsQuery(filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        
        return HandleResult(result);
    }
}