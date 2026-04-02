using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Products.Update;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheVersionService _cacheVersionService;

    public UpdateProductCommandHandler(IApplicationDbContext context, IMapper mapper, ICacheVersionService cacheVersionService)
    {
        _context = context;
        _mapper = mapper;
        _cacheVersionService = cacheVersionService;
    }

    public async Task<Result<ProductDto>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            return Result<ProductDto>.Failure("Invalid product ID.");
        }

        if (request.Product == null)
        {
            return Result<ProductDto>.Failure("Product data is required.");
        }

        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            return Result<ProductDto>.Failure("Product not found.");
        }

        Category category = null;
        if (!string.IsNullOrWhiteSpace(request.Product.CategoryId))
        {
            category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.Product.CategoryId, cancellationToken);
            if (category == null)
            {
                return Result<ProductDto>.Failure("Category not found.");
            }
        }

            Brand brand = null;
            if (!string.IsNullOrWhiteSpace(request.Product.BrandId))
            {
                brand = await _context.Brands.FirstOrDefaultAsync(c => c.Id == request.Product.BrandId, cancellationToken);
                if (brand == null)
                {
                    return Result<ProductDto>.Failure("Brand not found.");
                }
            }

        product.Name = request.Product.Name;
        product.CodeNumber = request.Product.CodeNumber ?? string.Empty;
        product.Description = request.Product.Description ?? string.Empty;
        product.CategoryId = category?.Id;
        product.Category = category;
        product.BrandId = brand?.Id;
        product.Brand = brand;
        product.Price = request.Product.Price;
        if (!string.IsNullOrWhiteSpace(request.Product.ImageUrl))
        {
            product.ImageUrl = request.Product.ImageUrl;
            product.ImagePublicId = null;
        }

        product.Quality = request.Product.Quality ?? string.Empty;
        product.VoucherNumber = request.Product.VoucherNumber ?? string.Empty;
        product.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        _cacheVersionService.Invalidate("products");

        return Result<ProductDto>.Success(_mapper.Map<ProductDto>(product));
    }
}
