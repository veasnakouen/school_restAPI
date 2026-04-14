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

        // Handle Category - lookup by ID (preferred) or Name (fallback)
        Category? category = null;
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
                category = new Category { Name = request.Product.CategoryName };
                _context.Categories.Add(category);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        // Handle Brand - lookup by ID (preferred) or Name (fallback)
        Brand? brand = null;
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
                brand = new Brand { Name = request.Product.BrandName };
                _context.Brands.Add(brand);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        // Map the DTO to entity
        var product = _mapper.Map<Product>(request.Product);
        product.Id = Guid.NewGuid().ToString();
        product.CategoryId = category?.Id;
        product.BrandId = brand?.Id;
        product.CreatedDate = DateTime.UtcNow;
        product.UpdateDate = null;
        product.Description = request.Product.Description ?? string.Empty;
        product.Quality = request.Product.Quality ?? string.Empty;
        product.VoucherNumber = request.Product.VoucherNumber ?? string.Empty;
        product.CodeNumber = request.Product.CodeNumber ?? string.Empty;

        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);
        _cacheVersionService.Invalidate("products");

        var createdProduct = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Image)
            .FirstOrDefaultAsync(p => p.Id == product.Id, cancellationToken);

        if (createdProduct == null)
        {
            return Result<ProductDto>.Failure("Product was created but could not be retrieved.");
        }

        var productDto = _mapper.Map<ProductDto>(createdProduct);
        return Result<ProductDto>.Success(productDto);
    }
}
