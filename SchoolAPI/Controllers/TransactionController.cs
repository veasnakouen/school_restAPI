using System;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Constant;
using SchoolAPI.Application.Features.Transactions.Create;
using SchoolAPI.Application.Features.Transactions.Delete;
using SchoolAPI.Application.Features.Transactions.GetAll;
using SchoolAPI.Application.Features.Transactions.GetById;
using SchoolAPI.Application.Features.Transactions.Update;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[Route("api/transactions")]
[ApiController]
[Authorize(Policy = Permissions.TransactionRead)]
public class TransactionController : ControllerBase
{
    private readonly ISender _sender;

    public TransactionController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAllTransactions([FromQuery] string? filterOn = null, [FromQuery] string? filterQuery = null, [FromQuery] string? sortBy = null, [FromQuery] bool isAscending = true, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetAllTransactionsQuery(filterOn, filterQuery, sortBy, isAscending, pageNumber, pageSize, startDate, endDate), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpGet("{transactionId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTransactionById(string transactionId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetTransactionByIdQuery(transactionId), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.TransactionCreate)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTransaction([FromBody] TransactionDto transactionDto, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateTransactionCommand(transactionDto), cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result.ErrorMessage);
        }

        return CreatedAtAction(nameof(GetTransactionById), new { transactionId = result.Data?.Id }, result.Data);
    }

    [HttpPut("{transactionId}")]
    [Authorize(Policy = Permissions.TransactionUpdate)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTransaction(string transactionId, [FromBody] TransactionDto transactionDto, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(transactionDto.Id) && !string.Equals(transactionId, transactionDto.Id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Invalid transaction ID or mismatched ID in request body.");
        }

        var result = await _sender.Send(new UpdateTransactionCommand(transactionId, transactionDto), cancellationToken);
        return result.IsSuccess ? Ok(result.Data) : NotFound(result.ErrorMessage);
    }

    [HttpDelete("{transactionId}")]
    [Authorize(Policy = Permissions.TransactionDelete)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTransaction(string transactionId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteTransactionCommand(transactionId), cancellationToken);
        return result.IsSuccess ? Ok("Transaction deleted successfully.") : NotFound(result.ErrorMessage);
    }
}
