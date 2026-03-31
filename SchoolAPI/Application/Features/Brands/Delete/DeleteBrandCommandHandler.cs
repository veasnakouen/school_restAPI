using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Brands.Delete;

public class DeleteBrandCommandHandler : IRequestHandler<DeleteBrandCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteBrandCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteBrandCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.BrandId))
        {
            return Result.Failure("Invalid brand ID.");
        }

        var brand = await _context.Brands.FirstOrDefaultAsync(x => x.Id == request.BrandId, cancellationToken);
        if (brand == null)
        {
            return Result.Failure("Brand not found.");
        }

        _context.Brands.Remove(brand);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
