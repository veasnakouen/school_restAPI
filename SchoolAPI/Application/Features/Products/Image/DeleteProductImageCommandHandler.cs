using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Products.Image;

public class DeleteProductImageCommandHandler : IRequestHandler<DeleteProductImageCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPhotoService _photoService;
    private readonly IMapper _mapper;
    private readonly ICacheVersionService _cacheVersionService;

    public DeleteProductImageCommandHandler(IApplicationDbContext context, IPhotoService photoService, IMapper mapper, ICacheVersionService cacheVersionService)
    {
        _context = context;
        _photoService = photoService;
        _mapper = mapper;
        _cacheVersionService = cacheVersionService;
    }

    public async Task<Result<ProductDto>> Handle(DeleteProductImageCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            return Result<ProductDto>.Failure("Invalid product ID.");
        }

        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Image)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            return Result<ProductDto>.Failure("Product not found.");
        }

        if (product.Image != null)
        {
            var publicId = product.Image.PublicId;
            
            // Delete from Cloudinary
            if (!string.IsNullOrWhiteSpace(publicId))
            {
                await _photoService.DeletePhotoAsync(publicId);
            }
            
            // Remove the ProductImage entity
            _context.ProductImages.Remove(product.Image);
        }
        
        product.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        _cacheVersionService.Invalidate("products");

        return Result<ProductDto>.Success(_mapper.Map<ProductDto>(product));
    }
}