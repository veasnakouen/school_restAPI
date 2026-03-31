using AutoMapper;
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
    private readonly IMapper _mapper;

    public CreateProductCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
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

        var productDto = _mapper.Map<ProductDto>(product);
        return Result<ProductDto>.Success(productDto);
    }
}
