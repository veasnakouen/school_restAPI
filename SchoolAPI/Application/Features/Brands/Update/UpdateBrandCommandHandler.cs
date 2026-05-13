using MediatR;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Brands.Update;

public class UpdateBrandCommandHandler : IRequestHandler<UpdateBrandCommand, Result<BrandDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateBrandCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<BrandDto>> Handle(UpdateBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _context.Brands.FindAsync(new object[] { request.Id }, cancellationToken);
        if (brand == null)
        {
            return Result<BrandDto>.Failure("Brand not found.");
        }

        brand.Name = request.BrandDto.Name;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<BrandDto>.Success(request.BrandDto);
    }
}