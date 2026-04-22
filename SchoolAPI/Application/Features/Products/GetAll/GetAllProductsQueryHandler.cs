using System.Linq.Expressions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;
using SchoolAPI.Extensions;

namespace SchoolAPI.Application.Features.Products.GetAll;

public class GetAllProductsQueryHandler : IRequestHandler<GetAllProductsQuery, Result<PagedResult<ProductDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAllProductsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<ProductDto>>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Department)
            .Include(p => p.Image)
            .AsNoTracking();

        // Filtering
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            query = query.Where(p => EF.Functions.ILike(p.ProductName, $"%{request.Name}%"));
        }
        if (!string.IsNullOrWhiteSpace(request.CategoryId))
        {
            query = query.Where(p => p.CategoryId == request.CategoryId);
        }
        if (!string.IsNullOrWhiteSpace(request.DepartmentId))
        {
            query = query.Where(p => p.DepartmentId == request.DepartmentId);
        }

        // Sorting
        if (!string.IsNullOrWhiteSpace(request.SortBy))
        {
            switch (request.SortBy.ToLowerInvariant())
            {
                case "name":
                    query = request.IsAscending ? query.OrderBy(p => p.ProductName) : query.OrderByDescending(p => p.ProductName);
                    break;
                case "price":
                    query = request.IsAscending ? query.OrderBy(p => p.Price) : query.OrderByDescending(p => p.Price);
                    break;
                case "categoryname":
                    query = request.IsAscending ? query.OrderBy(p => p.Category.Name) : query.OrderByDescending(p => p.Category.Name);
                    break;
                case "brandname":
                    query = request.IsAscending ? query.OrderBy(p => p.Brand.Name) : query.OrderByDescending(p => p.Brand.Name);
                    break;
                case "departmentname":
                    query = request.IsAscending ? query.OrderBy(p => p.Department.Name) : query.OrderByDescending(p => p.Department.Name);
                    break;
                default:
                    query = request.IsAscending ? query.OrderBy(p => p.CreatedDate) : query.OrderByDescending(p => p.CreatedDate);
                    break;
            }
        }
        else
        {
            // Add a default sort order if none is specified
            query = query.OrderByDescending(p => p.CreatedDate);
        }

        var pagedResult = await query
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.ProductName,
                Price = p.Price,
                ImageUrl = p.Image != null ? p.Image.Url : null,
                CategoryName = p.Category != null ? p.Category.Name : null,
                BrandName = p.Brand != null ? p.Brand.Name : null,
                DepartmentName = p.Department != null ? p.Department.Name : null,
                CodeNumber = p.CodeNumber,
                Year = p.Year,
                Attributes = p.Attributes
            })
            .ToPagedResultAsync(request.PageNumber, request.PageSize, cancellationToken);
            
        return Result<PagedResult<ProductDto>>.Success(pagedResult);
    }
}