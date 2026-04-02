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
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            return Result<ProductDto>.Failure("Product not found.");
        }

        var existingPublicId = product.ImagePublicId;
        ImageUploadResult uploadResult = await _photoService.UploadPhotoAsync(request.File);

        if (uploadResult.Error != null || uploadResult.SecureUrl == null)
        {
            return Result<ProductDto>.Failure(uploadResult.Error?.Message ?? "Image upload failed.");
        }

        product.ImageUrl = uploadResult.SecureUrl.ToString();
        product.ImagePublicId = uploadResult.PublicId;
        product.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        _cacheVersionService.Invalidate("products");

        if (!string.IsNullOrWhiteSpace(existingPublicId) && !string.Equals(existingPublicId, product.ImagePublicId, StringComparison.OrdinalIgnoreCase))
        {
            await _photoService.DeletePhotoAsync(existingPublicId);
        }

        return Result<ProductDto>.Success(_mapper.Map<ProductDto>(product));
    }
}