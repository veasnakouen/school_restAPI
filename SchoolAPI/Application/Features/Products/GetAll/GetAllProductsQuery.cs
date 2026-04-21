using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.GetAll;

public record GetAllProductsQuery(
    string? Name,
    string? CategoryId,
    string? DepartmentId,
    string? SortBy,
    bool IsAscending,
    int PageNumber,
    int PageSize) : IRequest<Result<PagedResult<ProductDto>>>;