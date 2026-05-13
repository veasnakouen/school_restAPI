using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Transactions.Create;

public record CreateTransactionCommand(TransactionDto Transaction) : IRequest<Result<TransactionDto>>;
