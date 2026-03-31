using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Transactions.GetAll;

public record GetAllTransactionsQuery : IRequest<Result<List<TransactionDto>>>;
