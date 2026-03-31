using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Brands.Update;

public class UpdateBrandCommandHandler : IRequestHandler<UpdateBrandCommand, Result<BrandDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateBrandCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<BrandDto>> Handle(UpdateBrandCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.BrandId))
        {
            return Result<BrandDto>.Failure("Invalid brand ID.");
        }

        if (request.Brand == null)
        {
            return Result<BrandDto>.Failure("Brand data is required.");
        }

        var brand = await _context.Brands.FirstOrDefaultAsync(x => x.Id == request.BrandId, cancellationToken);
        if (brand == null)
        {
            return Result<BrandDto>.Failure("Brand not found.");
        }

        var duplicate = await _context.Brands.AnyAsync(x => x.Id != request.BrandId && x.Name == request.Brand.Name.Trim(), cancellationToken);
        if (duplicate)
        {
            return Result<BrandDto>.Failure("Brand already exists.");
        }

        brand.Name = request.Brand.Name.Trim();
        brand.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<BrandDto>.Success(_mapper.Map<BrandDto>(brand));
    }
}
