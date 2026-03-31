using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Brands.GetById;

public class GetBrandByIdQueryHandler : IRequestHandler<GetBrandByIdQuery, Result<BrandDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetBrandByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<BrandDto>> Handle(GetBrandByIdQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.BrandId))
        {
            return Result<BrandDto>.Failure("Invalid brand ID.");
        }

        var brand = await _context.Brands.FirstOrDefaultAsync(x => x.Id == request.BrandId, cancellationToken);
        if (brand == null)
        {
            return Result<BrandDto>.Failure("Brand not found.");
        }

        return Result<BrandDto>.Success(_mapper.Map<BrandDto>(brand));
    }
}
