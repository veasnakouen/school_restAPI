using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Responsers.GetById;

public class GetResponserByIdQueryHandler : IRequestHandler<GetResponserByIdQuery, Result<ResponserDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetResponserByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<ResponserDto>> Handle(GetResponserByIdQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ResponserId))
        {
            return Result<ResponserDto>.Failure("Invalid responser ID.");
        }

        var responser = await _context.Responsers.FirstOrDefaultAsync(x => x.Id == request.ResponserId, cancellationToken);
        if (responser == null)
        {
            return Result<ResponserDto>.Failure("Responser not found.");
        }

        return Result<ResponserDto>.Success(_mapper.Map<ResponserDto>(responser));
    }
}
