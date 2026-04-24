using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Products.Delete;

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteProductCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);

        if (product == null)
        {
            return Result.Failure("Product not found.");
        }

        // Implement soft delete by setting the IsActive flag to false
        product.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}