using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Brands.Delete;

public class DeleteBrandCommandHandler : IRequestHandler<DeleteBrandCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public DeleteBrandCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeleteBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _context.Brands.FindAsync(new object[] { request.Id }, cancellationToken);
        if (brand == null)
        {
            return Result<bool>.Failure("Brand not found.");
        }

        bool isUsedByProducts = await _context.Products.AnyAsync(p => p.BrandId == request.Id, cancellationToken);
        if (isUsedByProducts)
        {
            return Result<bool>.Failure("Cannot delete this brand because it is assigned to one or more products.");
        }

        _context.Brands.Remove(brand);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}