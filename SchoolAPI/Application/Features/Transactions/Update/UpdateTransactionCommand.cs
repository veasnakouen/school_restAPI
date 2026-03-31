using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Transactions.Update;

public record UpdateTransactionCommand(string TransactionId, TransactionDto Transaction) : IRequest<Result<TransactionDto>>;
