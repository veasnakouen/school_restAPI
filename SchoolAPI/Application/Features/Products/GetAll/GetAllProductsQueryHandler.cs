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
            .AsNoTracking()
            .Where(p => p.IsActive); // Only show active products by default

        // Filtering
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            query = query.Where(p => EF.Functions.ILike(p.ProductName, $"%{request.Name}%"));
        }
        if (!string.IsNullOrWhiteSpace(request.CategoryId))
        {
            // Materialize the list of IDs by calling .ToList() to prevent EF Core from
            // trying to translate string.Split, which causes a runtime evaluation error.
            var categoryIds = request.CategoryId.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            query = query.Where(p => p.CategoryId != null && categoryIds.Contains(p.CategoryId));
        }
        if (!string.IsNullOrWhiteSpace(request.DepartmentId))
        {
            var departmentIds = request.DepartmentId.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            query = query.Where(p => p.DepartmentId != null && departmentIds.Contains(p.DepartmentId));
        }
        if (!string.IsNullOrWhiteSpace(request.QualityId))
        {
            var qualityIds = request.QualityId.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            query = query.Where(p => p.QualityId != null && qualityIds.Contains(p.QualityId));
        }
        if (!string.IsNullOrWhiteSpace(request.PurchaseType))
        {
            query = query.Where(p => p.PurchaseItems.Any(pi => pi.Purchase != null && pi.Purchase.AcquisitionType == request.PurchaseType));
        }
        
        if (request.InvoiceStartDate.HasValue)
        {
            var startDate = request.InvoiceStartDate.Value.ToUniversalTime();
            query = query.Where(p => p.PurchaseItems.Any(pi => pi.Purchase != null && pi.Purchase.InvoiceDate >= startDate));
        }
        
        if (request.InvoiceEndDate.HasValue)
        {
            var endDate = request.InvoiceEndDate.Value.ToUniversalTime();
            query = query.Where(p => p.PurchaseItems.Any(pi => pi.Purchase != null && pi.Purchase.InvoiceDate <= endDate));
        }
        
        if (request.MinPrice.HasValue)
        {
            query = query.Where(p => p.Price >= request.MinPrice.Value);
        }
        
        if (request.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Price <= request.MaxPrice.Value);
        }
        
        // Fallback for free-text filters from frontend
        if (!string.IsNullOrWhiteSpace(request.FilterOn) && !string.IsNullOrWhiteSpace(request.FilterQuery))
        {
            if (request.FilterOn.Equals("categoryName", StringComparison.OrdinalIgnoreCase))
            {
                // The original .Any(cn => ...) is not translatable to SQL.
                // The frontend sends exact category names, so we use List.Contains()
                // which EF Core translates to an efficient `WHERE ... IN (...)` clause.
                var catNames = request.FilterQuery.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(n => n.Trim().ToLower()).ToList();
                query = query.Where(p => p.Category != null && catNames.Contains(p.Category.Name.ToLower()));
            }
            else if (request.FilterOn.Equals("departmentName", StringComparison.OrdinalIgnoreCase))
            {
                var deptNames = request.FilterQuery.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(n => n.Trim().ToLower()).ToList();
                query = query.Where(p => p.Department != null && deptNames.Contains(p.Department.Name.ToLower()));
            }
            else if (request.FilterOn.Equals("quality", StringComparison.OrdinalIgnoreCase))
            {
                var qualityNames = request.FilterQuery.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(n => n.Trim().ToLower()).ToList();
                query = query.Where(p => p.Quality != null && qualityNames.Contains(p.Quality.Name.ToLower()));
            }
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
                    query = request.IsAscending ? query.OrderBy(p => p.Category != null ? p.Category.Name : "") : query.OrderByDescending(p => p.Category != null ? p.Category.Name : "");
                    break;
                case "brandname":
                    query = request.IsAscending ? query.OrderBy(p => p.Brand != null ? p.Brand.Name : "") : query.OrderByDescending(p => p.Brand != null ? p.Brand.Name : "");
                    break;
                case "departmentname":
                    query = request.IsAscending ? query.OrderBy(p => p.Department != null ? p.Department.Name : "") : query.OrderByDescending(p => p.Department != null ? p.Department.Name : "");
                    break;
                case "codenumber":
                    query = request.IsAscending ? query.OrderBy(p => p.CodeNumber) : query.OrderByDescending(p => p.CodeNumber);
                    break;
                case "year":
                    query = request.IsAscending ? query.OrderBy(p => p.Year) : query.OrderByDescending(p => p.Year);
                    break;
                case "updatedate":
                    query = request.IsAscending ? query.OrderBy(p => p.UpdateDate ?? p.CreatedDate) : query.OrderByDescending(p => p.UpdateDate ?? p.CreatedDate);
                    break;
                default:
                    query = request.IsAscending ? query.OrderBy(p => p.CreatedDate) : query.OrderByDescending(p => p.CreatedDate);
                    break;
            }
        }
        else
        {
            // Add a default sort order if none is specified
            query = query.OrderByDescending(p => p.UpdateDate ?? p.CreatedDate);
        }

        var pagedResult = await (from p in query
            let latestPI = p.PurchaseItems.OrderByDescending(pi => pi.CreatedDate).FirstOrDefault()
            select new ProductDto
            {
                Id = p.Id,
                IsActive = p.IsActive,
                Name = p.ProductName,
                Price = p.Price,
                ImageUrl = p.Image != null ? p.Image.Url : null,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : null,
                BrandId = p.BrandId,
                BrandName = p.Brand != null ? p.Brand.Name : null,
                DepartmentId = p.DepartmentId,
                DepartmentName = p.Department != null ? p.Department.Name : null,
                QualityId = p.QualityId,
                Quality = p.Quality != null ? p.Quality.Name : null,
                ResponsiblePersonId = latestPI != null ? latestPI.ResponsiblePersonId.ToString() : null,
                ResponsiblePerson = latestPI != null && latestPI.ResponsiblePerson != null ? latestPI.ResponsiblePerson.FullName : null,
                PurchaseType = latestPI != null && latestPI.Purchase != null ? latestPI.Purchase.AcquisitionType : null,
                VoucherNumber = latestPI != null && latestPI.Purchase != null ? latestPI.Purchase.VoucherNumber : null,
                DonorName = latestPI != null && latestPI.Purchase != null && latestPI.Purchase.Notes != null ? latestPI.Purchase.Notes.Replace("Donated by: ", "") : null,
                InitialQuantity = latestPI != null ? (int?)latestPI.Quantity : null,
                SupplierName = latestPI != null && latestPI.Purchase != null && latestPI.Purchase.Supplier != null ? latestPI.Purchase.Supplier.Name : null,
                SupplierContactList = latestPI != null && latestPI.Purchase != null && latestPI.Purchase.Supplier != null ? latestPI.Purchase.Supplier.ContactInfo : null,
                CodeNumber = p.CodeNumber,
                Year = p.Year.HasValue ? p.Year.Value.ToString("o") : null,
                PlateNumber = p.PlateNumber,
                EngineNumber = p.EngineNumber,
                Attributes = p.Attributes,
                Description = p.Description,
                CreatedDate = p.CreatedDate.HasValue ? p.CreatedDate.Value.ToString("o") : null,
                UpdateDate = p.UpdateDate.HasValue ? p.UpdateDate.Value.ToString("o") : null
            })
            .ToPagedResultAsync(request.PageNumber, request.PageSize, cancellationToken);
            
        return Result<PagedResult<ProductDto>>.Success(pagedResult);
    }
}