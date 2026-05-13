using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Brands.GetAll;

public class GetAllBrandsQueryHandler : IRequestHandler<GetAllBrandsQuery, Result<List<BrandDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAllBrandsQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<BrandDto>>> Handle(GetAllBrandsQuery request, CancellationToken cancellationToken)
    {
        var brands = await _context.Brands
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return Result<List<BrandDto>>.Success(_mapper.Map<List<BrandDto>>(brands));
    }
}
