using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Responsers.GetAll;

public class GetAllResponsersQueryHandler : IRequestHandler<GetAllResponsersQuery, Result<List<ResponserDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAllResponsersQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<ResponserDto>>> Handle(GetAllResponsersQuery request, CancellationToken cancellationToken)
    {
        var responsers = await _context.Responsers
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return Result<List<ResponserDto>>.Success(_mapper.Map<List<ResponserDto>>(responsers));
    }
}
