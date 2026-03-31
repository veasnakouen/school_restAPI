using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Transactions.GetById;

public record GetTransactionByIdQuery(string TransactionId) : IRequest<Result<TransactionDto>>;
