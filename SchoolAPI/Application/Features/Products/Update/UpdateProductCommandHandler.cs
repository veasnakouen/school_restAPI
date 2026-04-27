using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Products.Update;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<ProductDto>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .Include(p => p.PurchaseItems)
                .ThenInclude(pi => pi.Purchase)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (product == null)
        {
            return Result<ProductDto>.Failure($"Product with ID {request.Id} not found.");
        }

        var productDto = request.ProductDto;

        DateTime? year = null;
        if (!string.IsNullOrWhiteSpace(productDto.Year) && DateTime.TryParse(productDto.Year, null, System.Globalization.DateTimeStyles.RoundtripKind, out var parsedYear))
        {
            year = parsedYear.ToUniversalTime();
        }

        // 2. Update the Product entity's main properties
        product.ProductName = productDto.Name;
        product.Description = productDto.Description ?? string.Empty;
        product.Price = productDto.Price;
        product.CodeNumber = productDto.CodeNumber;
        product.Attributes = productDto.Attributes;
        product.Year = year;
        product.PlateNumber = productDto.PlateNumber;
        product.EngineNumber = productDto.EngineNumber;
        product.CategoryId = !string.IsNullOrWhiteSpace(productDto.CategoryId) ? productDto.CategoryId : (await FindOrCreateCategoryAsync(productDto.CategoryName, cancellationToken))?.Id;
        product.BrandId = !string.IsNullOrWhiteSpace(productDto.BrandId) ? productDto.BrandId : (await FindOrCreateBrandAsync(productDto.BrandName, cancellationToken))?.Id;
        product.DepartmentId = !string.IsNullOrWhiteSpace(productDto.DepartmentId) ? productDto.DepartmentId : (await FindOrCreateDepartmentAsync(productDto.DepartmentName, cancellationToken))?.Id;
        product.QualityId = !string.IsNullOrWhiteSpace(productDto.QualityId) ? productDto.QualityId : (await FindOrCreateQualityAsync(productDto.Quality, cancellationToken))?.Id;
        product.UpdateDate = DateTime.UtcNow;

        // 3. Handle Purchase Information (ONLY if it doesn't exist yet)
        if (!product.PurchaseItems.Any() && productDto.PurchaseType != null && productDto.PurchaseType != "None" && productDto.InitialQuantity.HasValue && productDto.InitialQuantity > 0)
        {
            var supplierName = string.IsNullOrWhiteSpace(productDto.SupplierName) ? "Unknown" : productDto.SupplierName;
            var supplier = await FindOrCreateSupplierAsync(supplierName, productDto.SupplierContact, cancellationToken);
            var responsiblePerson = await FindOrCreatePersonAsync(productDto.ResponsiblePersonId, productDto.ResponsiblePerson, cancellationToken);

            DateTime? invoiceDate = null;
            if (!string.IsNullOrWhiteSpace(productDto.InvoiceDate) && DateTime.TryParse(productDto.InvoiceDate, null, System.Globalization.DateTimeStyles.RoundtripKind, out var parsedInvoiceDate))
            {
                invoiceDate = parsedInvoiceDate.ToUniversalTime();
            }

            var purchase = new Purchase
            {
                Id = Guid.NewGuid().ToString(),
                AcquisitionType = productDto.PurchaseType,
                VoucherNumber = productDto.VoucherNumber,
                InvoiceDate = invoiceDate ?? DateTime.UtcNow,
                SupplierId = supplier!.Id, // Guaranteed to be valid now!
                Notes = !string.IsNullOrWhiteSpace(productDto.DonorName) ? $"Donated by: {productDto.DonorName}" : null,
                CreatedDate = DateTime.UtcNow
            };
            _context.Purchases.Add(purchase);

            var purchaseItem = new PurchaseItem
            {
                Id = Guid.NewGuid().ToString(),
                ProductId = product.Id,
                PurchaseId = purchase.Id,
                Quantity = (int)productDto.InitialQuantity.Value,
                UnitPrice = productDto.Price ?? 0,
                ResponsiblePersonId = responsiblePerson?.Id,
                CreatedDate = DateTime.UtcNow
            };
            _context.PurchaseItems.Add(purchaseItem);
        }
        else if (product.PurchaseItems.Any())
        {
            // If the product already has purchases, update the latest Voucher Number and Responsible Person
            var latestItem = product.PurchaseItems.OrderByDescending(pi => pi.CreatedDate).FirstOrDefault();
            if (latestItem != null)
            {
                var responsiblePerson = await FindOrCreatePersonAsync(productDto.ResponsiblePersonId, productDto.ResponsiblePerson, cancellationToken);
                latestItem.ResponsiblePersonId = responsiblePerson?.Id;
                    _context.PurchaseItems.Update(latestItem);

                if (latestItem.Purchase != null)
                {
                    latestItem.Purchase.VoucherNumber = productDto.VoucherNumber;
                        _context.Purchases.Update(latestItem.Purchase);
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<ProductDto>.Success(productDto);
    }

    private async Task<Category?> FindOrCreateCategoryAsync(string? name, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var normalizedName = name.Trim();
        var entity = await _context.Categories.FirstOrDefaultAsync(e => EF.Functions.ILike(e.Name, normalizedName), cancellationToken);
        if (entity == null)
        {
            entity = new Category { Id = Guid.NewGuid().ToString(), Name = normalizedName };
            await _context.Categories.AddAsync(entity, cancellationToken);
        }
        return entity;
    }

    private async Task<Brand?> FindOrCreateBrandAsync(string? name, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var normalizedName = name.Trim();
        var entity = await _context.Brands.FirstOrDefaultAsync(e => EF.Functions.ILike(e.Name, normalizedName), cancellationToken);
        if (entity == null)
        {
            entity = new Brand { Id = Guid.NewGuid().ToString(), Name = normalizedName };
            await _context.Brands.AddAsync(entity, cancellationToken);
        }
        return entity;
    }

    private async Task<Department?> FindOrCreateDepartmentAsync(string? name, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var normalizedName = name.Trim();
        var entity = await _context.Departments.FirstOrDefaultAsync(e => EF.Functions.ILike(e.Name, normalizedName), cancellationToken);
        if (entity == null)
        {
            entity = new Department { Id = Guid.NewGuid().ToString(), Name = normalizedName };
            await _context.Departments.AddAsync(entity, cancellationToken);
        }
        return entity;
    }

    private async Task<Quality?> FindOrCreateQualityAsync(string? name, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var normalizedName = name.Trim();
        var entity = await _context.Qualities.FirstOrDefaultAsync(e => EF.Functions.ILike(e.Name, normalizedName), cancellationToken);
        if (entity == null)
        {
            entity = new Quality { Id = Guid.NewGuid().ToString(), Name = normalizedName };
            await _context.Qualities.AddAsync(entity, cancellationToken);
        }
        return entity;
    }

    private async Task<Supplier?> FindOrCreateSupplierAsync(string? name, string? contact, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        var normalizedName = name.Trim();
        var entity = await _context.Suppliers.FirstOrDefaultAsync(e => EF.Functions.ILike(e.Name, normalizedName), cancellationToken);
        if (entity == null)
        {
            entity = new Supplier { Id = Guid.NewGuid().ToString(), Name = normalizedName };
            await _context.Suppliers.AddAsync(entity, cancellationToken);
        }
        return entity;
    }

    private async Task<Person?> FindOrCreatePersonAsync(string? personId, string? personName, CancellationToken cancellationToken)
    {
        // Prefer finding by ID if provided and valid
        if (!string.IsNullOrWhiteSpace(personId) && Guid.TryParse(personId, out var parsedId))
        {
            var personById = await _context.Persons.FindAsync(new object[] { parsedId }, cancellationToken);
            if (personById != null)
            {
                return personById;
            }
        }

        // Fallback to finding or creating by name
        if (!string.IsNullOrWhiteSpace(personName))
        {
            var normalizedName = personName.Trim();
            var personByName = await _context.Persons.FirstOrDefaultAsync(p => EF.Functions.ILike(p.FullName, normalizedName), cancellationToken);
            if (personByName != null) return personByName;

            var newPerson = new Person { Id = Guid.NewGuid(), FullName = normalizedName, IsActive = true };
            await _context.Persons.AddAsync(newPerson, cancellationToken);
            return newPerson;
        }

        return null;
    }
}