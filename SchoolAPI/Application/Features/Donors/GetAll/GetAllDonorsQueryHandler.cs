using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Donors.GetAll;

public class GetAllDonorsQueryHandler : IRequestHandler<GetAllDonorsQuery, Result<List<DonorDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAllDonorsQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<DonorDto>>> Handle(GetAllDonorsQuery request, CancellationToken cancellationToken)
    {
        var donors = await _context.Donors
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return Result<List<DonorDto>>.Success(_mapper.Map<List<DonorDto>>(donors));
    }
}
