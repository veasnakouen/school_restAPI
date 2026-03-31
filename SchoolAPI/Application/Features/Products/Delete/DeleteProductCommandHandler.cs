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
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            return Result.Failure("Invalid product ID.");
        }

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);
        if (product == null)
        {
            return Result.Failure("Product not found.");
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
