using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Brands.Create;

public class CreateBrandCommandHandler : IRequestHandler<CreateBrandCommand, Result<BrandDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CreateBrandCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<BrandDto>> Handle(CreateBrandCommand request, CancellationToken cancellationToken)
    {
        if (request.Brand == null)
        {
            return Result<BrandDto>.Failure("Brand data is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Brand.Name))
        {
            return Result<BrandDto>.Failure("Brand name is required.");
        }

        var existing = await _context.Brands.AnyAsync(x => x.Name == request.Brand.Name.Trim(), cancellationToken);
        if (existing)
        {
            return Result<BrandDto>.Failure("Brand already exists.");
        }

        var brand = _mapper.Map<Brand>(request.Brand);
        brand.Id = Guid.NewGuid().ToString();
        brand.Name = request.Brand.Name.Trim();
        brand.CreatedDate = DateTime.UtcNow;
        brand.UpdateDate = null;

        _context.Brands.Add(brand);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<BrandDto>.Success(_mapper.Map<BrandDto>(brand));
    }
}
