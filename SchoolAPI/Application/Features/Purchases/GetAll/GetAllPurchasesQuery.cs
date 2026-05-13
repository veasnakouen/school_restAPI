using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Purchases.GetAll;

public record GetAllPurchasesQuery(
    string? filterOn,
    string? filterQuery,
    string? sortBy,
    bool isAscending,
    int pageNumber,
    int pageSize) : IRequest<Result<PagedResult<PurchaseDto>>>;