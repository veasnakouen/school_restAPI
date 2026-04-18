using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Products.Update;

public class UpdateProductCommandHandler(
    IApplicationDbContext context,
    IMapper mapper,
    ICacheVersionService cacheVersionService)
    : IRequestHandler<UpdateProductCommand, Result<ProductDto>>
{
    public async Task<Result<ProductDto>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
            return Result<ProductDto>.Failure("Invalid product ID.");

        if (request.Product is null)
            return Result<ProductDto>.Failure("Product data is required.");

        // .AsNoTracking()
        var product = await context.Products
            .Include(p => p.Category)
            .Include(p => p.Quality)
            .Include(p => p.Supplier)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product is null)
            return Result<ProductDto>.Failure("Product not found.");

        if (!string.IsNullOrWhiteSpace(request.Product.CategoryId))
        {
            if (request.Product.CategoryId != product.CategoryId)
            {
                var category = await context.Categories
                    .FirstOrDefaultAsync(c => c.Id == request.Product.CategoryId, cancellationToken);

                if (category is null)
                    return Result<ProductDto>.Failure("Category not found.");

                product.Category = category;
                product.CategoryId = category.Id;
            }
        }
        else
        {
            product.Category = null;
            product.CategoryId = null;
        }

        if (!string.IsNullOrWhiteSpace(request.Product.BrandId))
        {
            if (request.Product.BrandId != product.BrandId)
            {
                var brand = await context.Brands
                    .FirstOrDefaultAsync(c => c.Id == request.Product.BrandId, cancellationToken);

                if (brand is null)
                    return Result<ProductDto>.Failure("Brand not found.");

                product.Brand = brand;
                product.BrandId = brand.Id;
            }
        }
        else
        {
            product.Brand = null;
            product.BrandId = null;
        }
        if (!string.IsNullOrWhiteSpace(request.Product.QualityId))
        {
            if (request.Product.QualityId != product.QualityId)
            {
                var quality = await context.Qualities
                    .FirstOrDefaultAsync(c => c.Id == request.Product.QualityId, cancellationToken);

                if (quality is null)
                    return Result<ProductDto>.Failure("Quality not found.");

                product.Quality = quality;
                product.QualityId = quality.Id;
            }
        }
        else
        {
            product.Quality = null;
            product.QualityId = null;
        }

        var supplierIdentifier = request.Product.Supplier ?? request.Product.SupplierName ?? request.Product.SupplierId;
        if (!string.IsNullOrWhiteSpace(supplierIdentifier))
        {
            if (supplierIdentifier != product.SupplierId && supplierIdentifier != product.Supplier?.Name)
            {
                var supplier = await context.Suppliers.FirstOrDefaultAsync(c => c.Id == supplierIdentifier, cancellationToken);

                if (supplier is null)
                {
                    supplier = await context.Suppliers.FirstOrDefaultAsync(c => c.Name == supplierIdentifier, cancellationToken);
                    if (supplier is null)
                    {
                        supplier = new Supplier { Name = supplierIdentifier };
                        context.Suppliers.Add(supplier);
                        await context.SaveChangesAsync(cancellationToken);
                    }
                }

                product.Supplier = supplier;
                product.SupplierId = supplier.Id;
            }
        }
        else
        {
            product.Supplier = null;
            product.SupplierId = null;
        }

        product.Name = request.Product.Name;
        product.CodeNumber = request.Product.CodeNumber ?? string.Empty;
        product.Description = request.Product.Description ?? string.Empty;
        product.Price = request.Product.Price;
        // product.Quality = request.Product.Quality ?? string.Empty;
        product.VoucherNumber = request.Product.VoucherNumber ?? string.Empty;
        product.UpdateDate = DateTime.UtcNow;

        // Note: Image is handled separately via UploadProductImage endpoint
        // Do not set product.Image.Url here to avoid NullReferenceException

        await context.SaveChangesAsync(cancellationToken);
        
        cacheVersionService.Invalidate("products");

        return Result<ProductDto>.Success(mapper.Map<ProductDto>(product));
    }
}
