using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Donors.Update;

public class UpdateDonorCommandHandler : IRequestHandler<UpdateDonorCommand, Result<DonorDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateDonorCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<DonorDto>> Handle(UpdateDonorCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DonorId))
        {
            return Result<DonorDto>.Failure("Invalid donor ID.");
        }

        if (request.Donor == null)
        {
            return Result<DonorDto>.Failure("Donor data is required.");
        }

        var donor = await _context.Donors.FirstOrDefaultAsync(x => x.Id == request.DonorId, cancellationToken);
        if (donor == null)
        {
            return Result<DonorDto>.Failure("Donor not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Donor.Name))
        {
            return Result<DonorDto>.Failure("Donor name is required.");
        }

        var name = request.Donor.Name.Trim();
        var duplicate = await _context.Donors.AnyAsync(x => x.Id != request.DonorId && x.Name == name, cancellationToken);
        if (duplicate)
        {
            return Result<DonorDto>.Failure("Donor already exists.");
        }

        donor.Name = name;
        donor.PhoneNumber = request.Donor.PhoneNumber?.Trim() ?? string.Empty;
        donor.Email = request.Donor.Email?.Trim() ?? string.Empty;
        donor.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<DonorDto>.Success(_mapper.Map<DonorDto>(donor));
    }
}
