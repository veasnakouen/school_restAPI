using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.GetAll;

public record GetAllProductsQuery(
    string? Name,
    string? CategoryId,
    string? DepartmentId,
    string? QualityId = null,
    string? PurchaseType = null,
    bool IsAscending = true,
    int PageNumber = 1,
    int PageSize = 10,
    string? SortBy = null,
    string? FilterOn = null,
    string? FilterQuery = null,
    string? ProductGroup = null,
    DateTime? InvoiceStartDate = null,
    DateTime? InvoiceEndDate = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null
) : IRequest<Result<PagedResult<ProductDto>>>;