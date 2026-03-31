using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Donors.Create;

public class CreateDonorCommandHandler : IRequestHandler<CreateDonorCommand, Result<DonorDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CreateDonorCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<DonorDto>> Handle(CreateDonorCommand request, CancellationToken cancellationToken)
    {
        if (request.Donor == null)
        {
            return Result<DonorDto>.Failure("Donor data is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Donor.Name))
        {
            return Result<DonorDto>.Failure("Donor name is required.");
        }

        var name = request.Donor.Name.Trim();
        var exists = await _context.Donors.AnyAsync(x => x.Name == name, cancellationToken);
        if (exists)
        {
            return Result<DonorDto>.Failure("Donor already exists.");
        }

        var donor = _mapper.Map<Donor>(request.Donor);
        donor.Id = Guid.NewGuid().ToString();
        donor.Name = name;
        donor.PhoneNumber = request.Donor.PhoneNumber?.Trim() ?? string.Empty;
        donor.Email = request.Donor.Email?.Trim() ?? string.Empty;
        donor.CreatedDate = DateTime.UtcNow;
        donor.UpdateDate = null;

        _context.Donors.Add(donor);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<DonorDto>.Success(_mapper.Map<DonorDto>(donor));
    }
}
