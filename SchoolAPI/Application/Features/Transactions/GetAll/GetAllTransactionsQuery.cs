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
    DateTime? EndDate,
    string? DepartmentId = null,
    string? TransactionType = null,
    string? Name = null,
    string? VehicleType = null
) : IRequest<Result<PagedResult<TransactionDto>>>;