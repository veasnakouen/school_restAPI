using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Products.Delete;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IPhotoService _photoService;
    private readonly ICacheVersionService _cacheVersionService;

    public DeleteProductCommandHandler(IApplicationDbContext context, IPhotoService photoService, ICacheVersionService cacheVersionService)
    {
        _context = context;
        _photoService = photoService;
        _cacheVersionService = cacheVersionService;
    }

    public async Task<Result> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            return Result.Failure("Invalid product ID.");
        }

        var product = await _context.Products
            .Include(p => p.Image)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);
            
        if (product == null)
        {
            return Result.Failure("Product not found.");
        }

        // Delete image from Cloudinary if exists
        if (product.Image != null && !string.IsNullOrWhiteSpace(product.Image.PublicId))
        {
            await _photoService.DeletePhotoAsync(product.Image.PublicId);
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync(cancellationToken);
        _cacheVersionService.Invalidate("products");

        return Result.Success();
    }
}
