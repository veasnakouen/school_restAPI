using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Transactions.Delete;

public record DeleteTransactionCommand(string TransactionId) : IRequest<Result>;
