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
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Department)
            .Include(p => p.Quality)
            .Include(p => p.Image)
            .Include(p => p.PurchaseItems)
                .ThenInclude(pi => pi.Purchase)
                    .ThenInclude(p => p!.Supplier)
            .Include(p => p.PurchaseItems)
                .ThenInclude(pi => pi.ResponsiblePerson)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            return Result<ProductDto>.Failure("Product not found.");
        }

        var productDto = new ProductDto
        {
            Id = product.Id,
            Name = product.ProductName,
            CodeNumber = product.CodeNumber,
            Description = product.Description,
            Attributes = product.Attributes,
            Price = product.Price,
            PlateNumber = product.PlateNumber,
            Year = product.Year?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            EngineNumber = product.EngineNumber,
            IsActive = product.IsActive,
            ImageUrl = product.Image?.Url,
            CreatedDate = product.CreatedDate?.ToString("o"),
            UpdateDate = product.UpdateDate?.ToString("o"),
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name,
            BrandId = product.BrandId,
            BrandName = product.Brand?.Name,
            DepartmentId = product.DepartmentId,
            DepartmentName = product.Department?.Name,
            QualityId = product.QualityId,
            Quality = product.Quality?.Name,
        };

        var initialPurchaseItem = product.PurchaseItems.OrderBy(pi => pi.CreatedDate).FirstOrDefault();
        if (initialPurchaseItem?.Purchase != null)
        {
            productDto.InitialQuantity = initialPurchaseItem.Quantity;
            productDto.ResponsiblePerson = initialPurchaseItem.ResponsiblePerson?.FullName;
            productDto.PurchaseType = initialPurchaseItem.Purchase.AcquisitionType;
            productDto.VoucherNumber = initialPurchaseItem.Purchase.VoucherNumber;
            productDto.InvoiceDate = initialPurchaseItem.Purchase.InvoiceDate.ToString("yyyy-MM-dd");
            productDto.SupplierName = initialPurchaseItem.Purchase.Supplier?.Name;
            productDto.DonorName = initialPurchaseItem.Purchase.AcquisitionType == "Donated" ? initialPurchaseItem.Purchase.Supplier?.Name : null;
            productDto.SupplierContact = string.Join(" | ", initialPurchaseItem.Purchase.Supplier?.ContactInfo ?? new List<string>());
        }

        productDto.PurchaseHistory = product.PurchaseItems
            .OrderByDescending(pi => pi.Purchase!.InvoiceDate)
            .Select(pi => new ProductPurchaseHistoryDto
            {
                PurchaseId = pi.PurchaseId,
                PurchaseDate = pi.Purchase!.InvoiceDate.ToString("o"),
                VoucherNumber = pi.Purchase.VoucherNumber,
                SupplierName = pi.Purchase.Supplier?.Name,
                Quantity = pi.Quantity,
                UnitPrice = pi.UnitPrice,
                TotalPrice = pi.TotalPrice
            }).ToList();

        return Result<ProductDto>.Success(productDto);
    }
}