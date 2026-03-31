using System;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using SchoolAPI.Application.Features.Transactions.Create;
using SchoolAPI.Application.Features.Transactions.Delete;
using SchoolAPI.Application.Features.Transactions.GetAll;
using SchoolAPI.Application.Features.Transactions.GetById;
using SchoolAPI.Application.Features.Transactions.Update;
using SchoolAPI.Contracts;

namespace SchoolAPI.Controllers;

[Route("api/transactions")]
[ApiController]
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
    public async Task<IActionResult> GetAllTransactions(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetAllTransactionsQuery(), cancellationToken);
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTransaction(string transactionId, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteTransactionCommand(transactionId), cancellationToken);
        return result.IsSuccess ? Ok("Transaction deleted successfully.") : NotFound(result.ErrorMessage);
    }
}
