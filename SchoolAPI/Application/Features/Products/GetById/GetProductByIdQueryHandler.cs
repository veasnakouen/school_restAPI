using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Products.GetById;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProductByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Quality)
            .Include(p => p.Department)
            .Include(p => p.Image)
            .Include(p => p.PurchaseItems)
                .ThenInclude(pi => pi.Purchase)
                .ThenInclude(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            return Result<ProductDto>.Failure("Product not found.");
        }

        var dto = new ProductDto
        {
            Id = product.Id,
            Name = product.ProductName,
            CodeNumber = product.CodeNumber,
            Description = product.Description,
            Price = product.Price,
            ImageUrl = product.Image?.Url,
            PlateNumber = product.PlateNumber,
            EngineNumber = product.EngineNumber,
            Year = product.Year,
            CreatedAt = product.CreatedAt,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            BrandId = product.BrandId,
            BrandName = product.Brand?.Name,
            QualityId = product.QualityId,
            Quality = product.Quality?.Name,
            DepartmentId = product.DepartmentId,
            DepartmentName = product.Department?.Name,
            PurchaseHistory = product.PurchaseItems
                .OrderByDescending(pi => pi.Purchase.InvoiceDate)
                .Select(pi => new ProductPurchaseHistoryDto
                {
                    PurchaseId = pi.PurchaseId,
                    PurchaseDate = pi.Purchase.InvoiceDate,
                    VoucherNumber = pi.Purchase.VoucherNumber,
                    SupplierName = pi.Purchase.Supplier?.Name,
                    Quantity = pi.Quantity,
                    UnitPrice = pi.UnitPrice,
                    TotalPrice = pi.TotalPrice
                }).ToList()
        };

        return Result<ProductDto>.Success(dto);
    }
}