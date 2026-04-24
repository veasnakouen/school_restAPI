using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Products.Update;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<UpdateProductCommandHandler> _logger;

    public UpdateProductCommandHandler(IApplicationDbContext context, ILogger<UpdateProductCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<ProductDto>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var dto = request.ProductDto;

        try
        {
            var product = await _context.Products
                .Include(p => p.PurchaseItems)
                    .ThenInclude(pi => pi.Purchase)
                        .ThenInclude(p => p!.Supplier)
                .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

            if (product == null)
            {
                return Result<ProductDto>.Failure("Product not found.");
            }

            // --- Find/Create related entities ---
            string? categoryId = null;
            if (!string.IsNullOrWhiteSpace(dto.CategoryName))
            {
                var category = await _context.Categories.FirstOrDefaultAsync(c => EF.Functions.ILike(c.Name, dto.CategoryName), cancellationToken);
                if (category == null)
                {
                    category = new Category { Name = dto.CategoryName };
                    _context.Categories.Add(category);
                }
                categoryId = category.Id;
            }

            string? brandId = null;
            if (!string.IsNullOrWhiteSpace(dto.BrandName))
            {
                var brand = await _context.Brands.FirstOrDefaultAsync(b => EF.Functions.ILike(b.Name, dto.BrandName), cancellationToken);
                if (brand == null)
                {
                    brand = new Brand { Name = dto.BrandName };
                    _context.Brands.Add(brand);
                }
                brandId = brand.Id;
            }

            string? departmentId = null;
            if (!string.IsNullOrWhiteSpace(dto.DepartmentName))
            {
                var department = await _context.Departments.FirstOrDefaultAsync(d => EF.Functions.ILike(d.Name, dto.DepartmentName), cancellationToken);
                if (department == null)
                {
                    department = new Department { Name = dto.DepartmentName };
                    _context.Departments.Add(department);
                }
                departmentId = department.Id;
            }

            string? qualityId = null;
            if (!string.IsNullOrWhiteSpace(dto.Quality))
            {
                var quality = await _context.Qualities.FirstOrDefaultAsync(q => EF.Functions.ILike(q.Name, dto.Quality), cancellationToken);
                if (quality == null)
                {
                    quality = new Quality { Name = dto.Quality };
                    _context.Qualities.Add(quality);
                }
                qualityId = quality.Id;
            }

            // --- Validate Code Number ---
            if (!string.IsNullOrWhiteSpace(dto.CodeNumber))
            {
                var existingProduct = await _context.Products
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id != request.ProductId && p.CodeNumber != null && EF.Functions.ILike(p.CodeNumber, dto.CodeNumber), cancellationToken);
                if (existingProduct != null)
                {
                    return Result<ProductDto>.Failure($"A product with code '{dto.CodeNumber}' already exists.");
                }
            }

            // --- Update Product's own properties ---
            product.ProductName = dto.Name;
            product.Description = dto.Description ?? string.Empty;
            product.CodeNumber = dto.CodeNumber;
            product.Attributes = dto.Attributes;
            product.Price = dto.Price;
            product.PlateNumber = dto.PlateNumber;
            product.EngineNumber = dto.EngineNumber;
            product.Year = DateTime.TryParse(dto.Year, out var yearDate) ? yearDate.ToUniversalTime() : null;
            product.CategoryId = categoryId;
            product.BrandId = brandId;
            product.DepartmentId = departmentId;
            product.QualityId = qualityId;
            product.UpdateDate = DateTime.UtcNow;

            // --- Update Initial Purchase Information ---
            // Since this section is now read-only on the frontend, we only need to
            // ensure the product's core price is reflected in the historical unit price.
            var initialPurchaseItem = product.PurchaseItems.OrderBy(pi => pi.CreatedDate).FirstOrDefault();
            if (initialPurchaseItem?.Purchase != null)
            {
                var purchase = initialPurchaseItem.Purchase;

                // Only update the unit price if the product's main price has changed.
                // All other initial purchase info is treated as a historical, immutable record.
                initialPurchaseItem.UnitPrice = purchase.AcquisitionType == "Donated" ? 0 : (dto.Price ?? initialPurchaseItem.UnitPrice);
                purchase.TotalAmount = initialPurchaseItem.TotalPrice;
            }
            else if (dto.InitialQuantity > 0 && !string.IsNullOrWhiteSpace(dto.PurchaseType) && dto.PurchaseType != "None")
            {
                string? sourceName = !string.IsNullOrWhiteSpace(dto.SupplierName) ? dto.SupplierName : dto.DonorName;

                if (!string.IsNullOrWhiteSpace(sourceName))
                {
                    // Find or Create Supplier (Treat Donors as Suppliers in the context of a Purchase)
                    var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => EF.Functions.ILike(s.Name, sourceName), cancellationToken);
                    if (supplier == null)
                    {
                        supplier = new Supplier
                        {
                            Id = Guid.NewGuid().ToString(),
                            Name = sourceName,
                            ContactInfo = !string.IsNullOrWhiteSpace(dto.SupplierContact) ? new List<string> { dto.SupplierContact } : new List<string>()
                        };
                        _context.Suppliers.Add(supplier);
                    }
                    else if (!string.IsNullOrWhiteSpace(dto.SupplierContact) && (supplier.ContactInfo == null || !supplier.ContactInfo.Contains(dto.SupplierContact)))
                    {
                        supplier.ContactInfo ??= new List<string>();
                        supplier.ContactInfo.Add(dto.SupplierContact);
                    }

                    var purchase = new Purchase
                    {
                        Id = Guid.NewGuid().ToString(),
                        SupplierId = supplier.Id,
                        VoucherNumber = dto.VoucherNumber,
                        InvoiceDate = DateTime.TryParse(dto.InvoiceDate, out var invoiceDate) ? invoiceDate.ToUniversalTime() : DateTime.UtcNow,
                        TotalAmount = dto.PurchaseType == "Donated" ? 0 : (dto.Price ?? 0) * (dto.InitialQuantity ?? 0),
                        AcquisitionType = dto.PurchaseType,
                        Notes = dto.PurchaseType == "Donated" ? $"Initial stock donated by {sourceName}" : "Initial stock purchase",
                        CreatedDate = DateTime.UtcNow
                    };
                    _context.Purchases.Add(purchase);

                    var purchaseItem = new PurchaseItem
                    {
                        Id = Guid.NewGuid().ToString(),
                        PurchaseId = purchase.Id,
                        ProductId = product.Id,
                        Quantity = dto.InitialQuantity.Value,
                        UnitPrice = dto.PurchaseType == "Donated" ? 0 : (dto.Price ?? 0),
                        Location = dto.DepartmentName ?? "",
                        CreatedDate = DateTime.UtcNow
                    };

                    // --- RELATIONAL ASSIGNMENT LOGIC ---
                    if (!string.IsNullOrWhiteSpace(dto.ResponsiblePerson))
                    {
                        var person = await _context.Persons.FirstOrDefaultAsync(p => EF.Functions.ILike(p.FullName, dto.ResponsiblePerson ?? ""), cancellationToken);
                        if (person == null)
                        {
                            person = new Person { Id = Guid.NewGuid(), FullName = dto.ResponsiblePerson };
                            _context.Persons.Add(person);
                        }

                        // Link Person to Purchase Item
                        purchaseItem.ResponsiblePersonId = person.Id;
                        
                        // Omitting the AssetAssignment & StockMovement here to adhere to the 1to1 model scope but storing Responsible Person.
                    }

                    _context.PurchaseItems.Add(purchaseItem);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            dto.Id = product.Id;
            return Result<ProductDto>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while updating product '{ProductName}' (ID: {ProductId}). DTO: {@ProductDto}", dto.Name, request.ProductId, dto);
            return Result<ProductDto>.Failure($"An unexpected error occurred: {ex.Message}");
        }
    }
}