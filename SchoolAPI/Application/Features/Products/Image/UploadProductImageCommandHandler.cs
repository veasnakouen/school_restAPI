using AutoMapper;
using CloudinaryDotNet.Actions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Helpers;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Products.Image;

public class UploadProductImageCommandHandler : IRequestHandler<UploadProductImageCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IPhotoService _photoService;
    private readonly IMapper _mapper;
    private readonly ILogger<UploadProductImageCommandHandler> _logger;
    private readonly ICacheVersionService _cacheVersionService;

    public UploadProductImageCommandHandler(IApplicationDbContext context, IPhotoService photoService, IMapper mapper, ICacheVersionService cacheVersionService)
    {
        _context = context;
        _photoService = photoService;
        _mapper = mapper;
        _cacheVersionService = cacheVersionService;
    }

    public async Task<Result<ProductDto>> Handle(UploadProductImageCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            return Result<ProductDto>.Failure("Invalid product ID.");
        }

        var validationError = ImageValidation.Validate(request.File);
        if (!string.IsNullOrWhiteSpace(validationError))
        {
            return Result<ProductDto>.Failure(validationError);
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

        // Get existing image public ID for deletion
        var existingPublicId = product.Image?.PublicId;
        
        ImageUploadResult uploadResult = await _photoService.UploadPhotoAsync(request.File);

        if (uploadResult.Error != null || uploadResult.SecureUrl == null)
        {
            var errorMessage = uploadResult.Error?.Message ?? "Unknown error during image upload.";
            _logger.LogError("Image upload failed: {ErrorMessage}", errorMessage);
            return Result<ProductDto>.Failure(errorMessage);
            
        }

        // Update or create ProductImage
        if (product.Image == null)
        {
            product.Image = new Entities.ProductImage
            {
                ProductId = product.Id,
                Url = uploadResult.SecureUrl.ToString(),
                PublicId = uploadResult.PublicId
            };
        }
        else
        {
            product.Image.Url = uploadResult.SecureUrl.ToString();
            product.Image.PublicId = uploadResult.PublicId;
        }
        
        product.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        _cacheVersionService.Invalidate("products");

        // Delete old image from Cloudinary
        if (!string.IsNullOrWhiteSpace(existingPublicId))
        {
            await _photoService.DeletePhotoAsync(existingPublicId);
        }

        return Result<ProductDto>.Success(_mapper.Map<ProductDto>(product));
    }
}