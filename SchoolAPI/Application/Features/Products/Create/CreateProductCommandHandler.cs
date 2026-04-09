using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Products.Create;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheVersionService _cacheVersionService;

    public CreateProductCommandHandler(IApplicationDbContext context, IMapper mapper, ICacheVersionService cacheVersionService)
    {
        _context = context;
        _mapper = mapper;
        _cacheVersionService = cacheVersionService;
    }

    public async Task<Result<ProductDto>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        if (request.Product == null)
        {
            return Result<ProductDto>.Failure("Product data is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Product.Name))
        {
            return Result<ProductDto>.Failure("Product name is required.");
        }

        // Handle Category - lookup by ID or Name, or create new
        Category category = null;
        if (!string.IsNullOrWhiteSpace(request.Product.CategoryId))
        {
            category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.Product.CategoryId, cancellationToken);
            if (category == null)
            {
                return Result<ProductDto>.Failure("Category not found.");
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Product.CategoryName))
        {
            category = await _context.Categories.FirstOrDefaultAsync(c => c.Name == request.Product.CategoryName, cancellationToken);
            if (category == null)
            {
                category = new Category { Id = Guid.NewGuid().ToString(), Name = request.Product.CategoryName };
                _context.Categories.Add(category);
            }
        }

        // Handle Brand - lookup by ID or Name, or create new
        Brand brand = null;
        if (!string.IsNullOrWhiteSpace(request.Product.BrandId))
        {
            brand = await _context.Brands.FirstOrDefaultAsync(b => b.Id == request.Product.BrandId, cancellationToken);
            if (brand == null)
            {
                return Result<ProductDto>.Failure("Brand not found.");
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Product.BrandName))
        {
            brand = await _context.Brands.FirstOrDefaultAsync(b => b.Name == request.Product.BrandName, cancellationToken);
            if (brand == null)
            {
                brand = new Brand { Id = Guid.NewGuid().ToString(), Name = request.Product.BrandName };
                _context.Brands.Add(brand);
            }
        }

        // Validate that at least one of Category or Brand is provided
        if (category == null && brand == null)
        {
            return Result<ProductDto>.Failure("At least one of Category or Brand must be provided.");
        }

        var product = _mapper.Map<Product>(request.Product);
        product.Id = Guid.NewGuid().ToString();
        product.Category = category;
        product.CategoryId = category?.Id;
        product.Brand = brand;
        product.BrandId = brand?.Id;
        product.CreatedDate = DateTime.UtcNow;
        product.UpdateDate = null;

        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);
        _cacheVersionService.Invalidate("products");

        var productDto = _mapper.Map<ProductDto>(product);
        return Result<ProductDto>.Success(productDto);
    }
}
