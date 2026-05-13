using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Donors.GetById;

public class GetDonorByIdQueryHandler : IRequestHandler<GetDonorByIdQuery, Result<DonorDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetDonorByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<DonorDto>> Handle(GetDonorByIdQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DonorId))
        {
            return Result<DonorDto>.Failure("Invalid donor ID.");
        }

        var donor = await _context.Donors.FirstOrDefaultAsync(x => x.Id == request.DonorId, cancellationToken);
        if (donor == null)
        {
            return Result<DonorDto>.Failure("Donor not found.");
        }

        return Result<DonorDto>.Success(_mapper.Map<DonorDto>(donor));
    }
}
