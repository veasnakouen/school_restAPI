using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.GetAll;

public record GetAllProductsQuery(
    string? Name,
    string? CategoryId,
    string? DepartmentId,
    string? SortBy,
    bool IsAscending = true,
    int PageNumber = 1,
    int PageSize = 10,
    string? FilterOn = null,
    string? FilterQuery = null
) : IRequest<Result<PagedResult<ProductDto>>>;