using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Products.Create;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public CreateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ProductDto>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var dto = request.ProductDto; 

        // 1. Find or Create Category
        string? categoryId = dto.CategoryId;
        if (string.IsNullOrWhiteSpace(categoryId) && !string.IsNullOrWhiteSpace(dto.CategoryName))
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => EF.Functions.ILike(c.Name, dto.CategoryName), cancellationToken);
            if (category == null)
            {
                category = new Category { Id = Guid.NewGuid().ToString(), Name = dto.CategoryName };
                _context.Categories.Add(category);
            }
            categoryId = category.Id;
        }

        // 2. Find or Create Brand
        string? brandId = dto.BrandId;
        if (string.IsNullOrWhiteSpace(brandId) && !string.IsNullOrWhiteSpace(dto.BrandName))
        {
            var brand = await _context.Brands.FirstOrDefaultAsync(b => EF.Functions.ILike(b.Name, dto.BrandName), cancellationToken);
            if (brand == null)
            {
                brand = new Brand { Id = Guid.NewGuid().ToString(), Name = dto.BrandName };
                _context.Brands.Add(brand);
            }
            brandId = brand.Id;
        }

        // 3. Find or Create Quality
        string? qualityId = dto.QualityId;
        if (string.IsNullOrWhiteSpace(qualityId) && !string.IsNullOrWhiteSpace(dto.Quality))
        {
            var quality = await _context.Qualities.FirstOrDefaultAsync(q => EF.Functions.ILike(q.Name, dto.Quality), cancellationToken);
            if (quality == null)
            {
                quality = new Quality { Id = Guid.NewGuid().ToString(), Name = dto.Quality };
                _context.Qualities.Add(quality);
            }
            qualityId = quality.Id;
        }

        // Find or Create Department
        string? departmentId = dto.DepartmentId;
        if (string.IsNullOrWhiteSpace(departmentId) && !string.IsNullOrWhiteSpace(dto.DepartmentName))
        {
            var department = await _context.Departments.FirstOrDefaultAsync(d => EF.Functions.ILike(d.Name, dto.DepartmentName), cancellationToken);
            if (department == null)
            {
                department = new Department { Id = Guid.NewGuid().ToString(), Name = dto.DepartmentName };
                _context.Departments.Add(department);
            }
            departmentId = department.Id;
        }

        // 4. Check for duplicate ProductCode before creating
        if (!string.IsNullOrWhiteSpace(dto.CodeNumber))
        {
            var existingProduct = await _context.Products
                .FirstOrDefaultAsync(p => EF.Functions.ILike(p.CodeNumber, dto.CodeNumber), cancellationToken);
            if (existingProduct != null)
            {
                return Result<ProductDto>.Failure($"A product with code '{dto.CodeNumber}' already exists.");
            }
        }

        // 4. Create the Product
        var product = new Product
        {
            Id = Guid.NewGuid().ToString(),
            ProductName = dto.Name,
            CodeNumber = dto.CodeNumber,
            Description = dto.Description ?? string.Empty,
            Attributes = dto.Attributes,
            Price = dto.Price,
            PlateNumber = dto.PlateNumber,
            Year = dto.Year,
            EngineNumber = dto.EngineNumber,
            CategoryId = categoryId,
            BrandId = brandId,
            QualityId = qualityId,
            DepartmentId = departmentId,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _context.Products.Add(product);
        
        // 5. Handle Initial Stock Acquisition (Purchased or Donated)
        if (dto.InitialQuantity > 0 && !string.IsNullOrWhiteSpace(dto.PurchaseType) && dto.PurchaseType != "None")
        {
            string? sourceName = !string.IsNullOrWhiteSpace(dto.SupplierName) ? dto.SupplierName : dto.DonorName;
            
            if (!string.IsNullOrWhiteSpace(sourceName))
            {
                // Find or Create Supplier (We treat Donors as Suppliers in the context of a Purchase transaction to track inventory reliably)
                var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => EF.Functions.ILike(s.Name, sourceName), cancellationToken);
                if (supplier == null)
                {
                    supplier = new Supplier { 
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
                    InvoiceDate = dto.InvoiceDate ?? DateTime.UtcNow,
                    TotalAmount = dto.PurchaseType == "Donated" ? 0 : ((dto.Price ?? 0) * dto.InitialQuantity.Value),
                    Status = dto.PurchaseType == "Donated" ? "Donated" : "Completed",
                    Notes = dto.PurchaseType == "Donated" ? $"Initial stock donated by {sourceName}" : "Initial stock purchase"
                };
                _context.Purchases.Add(purchase);

                var purchaseItem = new PurchaseItem
                {
                    Id = Guid.NewGuid().ToString(),
                    PurchaseId = purchase.Id,
                    ProductId = product.Id,
                    Quantity = dto.InitialQuantity.Value,
                    UnitPrice = dto.PurchaseType == "Donated" ? 0 : (dto.Price ?? 0),
                    Location = dto.DepartmentName ?? ""
                };

                // --- RELATIONAL ASSIGNMENT LOGIC ---
                if (!string.IsNullOrWhiteSpace(dto.ResponsiblePerson))
                {
                    // 1. Find or create the Person
                    var person = await _context.Persons.FirstOrDefaultAsync(p => EF.Functions.ILike(p.FullName, dto.ResponsiblePerson ?? ""), cancellationToken);
                    if (person == null)
                    {
                        person = new Person { Id = Guid.NewGuid(), FullName = dto.ResponsiblePerson };
                        _context.Persons.Add(person);
                    }

                    // 2. Link Person to Purchase Item
                    purchaseItem.ResponsiblePersonId = person.Id;

                    // 3. Create the required Stock Movement
                    var stockMovement = new StockMovement
                    {
                    Id = Guid.NewGuid().ToString(),
                        Type = MovementType.Purchase,
                        Direction = MovementDirection.In,
                        ProductId = product.Id,
                        PurchaseItemId = purchaseItem.Id,
                        Quantity = dto.InitialQuantity.Value,
                        QuantityBefore = 0,
                        QuantityAfter = dto.InitialQuantity.Value,
                        ToPersonId = person.Id,
                        MovedById = person.Id,
                        ToLocation = dto.DepartmentName ?? "",
                        Reason = "Initial stock acquisition",
                        MovedAt = DateTime.UtcNow,
                    CreatedDate = DateTime.UtcNow
                    };
                    _context.StockMovements.Add(stockMovement);

                    // 4. Create the Asset Assignment
                    var assignment = new AssetAssignment
                    {
                    Id = Guid.NewGuid().ToString(),
                        ProductId = product.Id,
                        PurchaseItemId = purchaseItem.Id,
                        Quantity = dto.InitialQuantity.Value,
                        AssignedToId = person.Id,
                        AssignedById = person.Id, // Fallback to same person
                        Location = dto.DepartmentName ?? "",
                        AssignedAt = DateTime.UtcNow,
                        Purpose = "Initial assignment upon purchase",
                        Status = AssignmentStatus.Active,
                        StockMovementId = stockMovement.Id
                    };
                    _context.AssetAssignments.Add(assignment);
                }

                _context.PurchaseItems.Add(purchaseItem);
            }
        }

        // This saves the Product, Category/Brand, AND initial Purchase records in one atomic transaction!
        await _context.SaveChangesAsync(cancellationToken);

        dto.Id = product.Id;
        dto.CategoryId = categoryId;
        dto.BrandId = brandId;
        dto.QualityId = qualityId;
        dto.DepartmentId = departmentId;

        return Result<ProductDto>.Success(dto);
    }
}