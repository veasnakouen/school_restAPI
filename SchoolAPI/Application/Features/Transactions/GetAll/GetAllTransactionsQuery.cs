using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Transactions.GetAll;

public record GetAllTransactionsQuery(
    string? FilterOn,
    string? FilterQuery,
    string? SortBy,
    bool IsAscending,
    int PageNumber,
    int PageSize,
    DateTime? StartDate,
    DateTime? EndDate
) : IRequest<Result<PagedResult<TransactionDto>>>;