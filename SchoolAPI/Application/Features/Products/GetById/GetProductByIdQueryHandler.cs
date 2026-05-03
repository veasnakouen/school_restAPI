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
        var rawProduct = await _context.Products
            .AsNoTracking()
            .Where(p => p.Id == request.ProductId)
            .Select(p => new
            {
                p.Id,
                p.ProductName,
                p.CodeNumber,
                p.Description,
                p.Attributes,
                p.Price,
                p.PlateNumber,
                p.Year,
                p.EngineNumber,
                p.IsActive,
                ImageUrl = p.Image != null ? p.Image.Url : null,
                p.CreatedDate,
                p.UpdateDate,
                p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : null,
                p.BrandId,
                BrandName = p.Brand != null ? p.Brand.Name : null,
                p.DepartmentId,
                DepartmentName = p.Department != null ? p.Department.Name : null,
                p.QualityId,
                Quality = p.Quality != null ? p.Quality.Name : null,
                PurchaseItems = p.PurchaseItems.Select(pi => new
                {
                    pi.PurchaseId,
                    pi.CreatedDate,
                    pi.Quantity,
                    pi.UnitPrice,
                    TotalPrice = pi.Quantity * pi.UnitPrice,
                    pi.ResponsiblePersonId,
                    ResponsiblePersonName = pi.ResponsiblePerson != null ? pi.ResponsiblePerson.FullName : null,
                    AcquisitionType = pi.Purchase != null ? pi.Purchase.AcquisitionType : null,
                    VoucherNumber = pi.Purchase != null ? pi.Purchase.VoucherNumber : null,
                    InvoiceDate = pi.Purchase != null ? (DateTime?)pi.Purchase.InvoiceDate : null,
                    SupplierName = pi.Purchase != null && pi.Purchase.Supplier != null ? pi.Purchase.Supplier.Name : null,
                    SupplierContactList = pi.Purchase != null && pi.Purchase.Supplier != null ? pi.Purchase.Supplier.ContactInfo : null
                })
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (rawProduct == null)
        {
            return Result<ProductDto>.Failure("Product not found.");
        }

        var productDto = new ProductDto
        {
            Id = rawProduct.Id,
            Name = rawProduct.ProductName,
            CodeNumber = rawProduct.CodeNumber,
            Description = rawProduct.Description,
            Attributes = rawProduct.Attributes,
            Price = rawProduct.Price,
            PlateNumber = rawProduct.PlateNumber,
            Year = rawProduct.Year?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            EngineNumber = rawProduct.EngineNumber,
            IsActive = rawProduct.IsActive,
            ImageUrl = rawProduct.ImageUrl,
            CreatedDate = rawProduct.CreatedDate?.ToString("o"),
            UpdateDate = rawProduct.UpdateDate?.ToString("o"),
            CategoryId = rawProduct.CategoryId,
            CategoryName = rawProduct.CategoryName,
            BrandId = rawProduct.BrandId,
            BrandName = rawProduct.BrandName,
            DepartmentId = rawProduct.DepartmentId,
            DepartmentName = rawProduct.DepartmentName,
            QualityId = rawProduct.QualityId,
            Quality = rawProduct.Quality,
            SupplierContact = null
        };

        var initialPurchaseItem = rawProduct.PurchaseItems?.OrderBy(pi => pi.CreatedDate).FirstOrDefault();
        if (initialPurchaseItem != null && initialPurchaseItem.AcquisitionType != null)
        {
            productDto.InitialQuantity = initialPurchaseItem.Quantity;
            productDto.ResponsiblePerson = initialPurchaseItem.ResponsiblePersonName;
            productDto.ResponsiblePersonId = initialPurchaseItem.ResponsiblePersonId?.ToString();
            productDto.PurchaseType = initialPurchaseItem.AcquisitionType;
            productDto.VoucherNumber = initialPurchaseItem.VoucherNumber;
            productDto.InvoiceDate = initialPurchaseItem.InvoiceDate?.ToString("yyyy-MM-dd");
            productDto.SupplierName = initialPurchaseItem.SupplierName;
            productDto.DonorName = initialPurchaseItem.AcquisitionType == "Donated" ? initialPurchaseItem.SupplierName : null;
            
            var contactDict = new Dictionary<string, string>();
            if (initialPurchaseItem.SupplierContactList != null)
            {
                foreach(var part in initialPurchaseItem.SupplierContactList) 
                {
                    var kv = part.Split(new[] { ": " }, 2, StringSplitOptions.None);
                    if(kv.Length == 2 && !contactDict.ContainsKey(kv[0])) contactDict.Add(kv[0], kv[1]);
                }
            }
            productDto.SupplierContact = contactDict;
        }

        productDto.PurchaseHistory = rawProduct.PurchaseItems?
            .OrderByDescending(pi => pi.InvoiceDate ?? DateTime.MinValue)
            .Select(pi => new ProductPurchaseHistoryDto
            {
                PurchaseId = pi.PurchaseId ?? string.Empty,
                PurchaseDate = pi.InvoiceDate?.ToString("o") ?? string.Empty,
                VoucherNumber = pi.VoucherNumber,
                SupplierName = pi.SupplierName,
                Quantity = pi.Quantity,
                UnitPrice = pi.UnitPrice,
                TotalPrice = pi.TotalPrice
            }).ToList() ?? new List<ProductPurchaseHistoryDto>();

        return Result<ProductDto>.Success(productDto);
    }
}