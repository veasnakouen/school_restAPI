using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Responsers.Update;

public class UpdateResponserCommandHandler : IRequestHandler<UpdateResponserCommand, Result<ResponserDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public UpdateResponserCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<ResponserDto>> Handle(UpdateResponserCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ResponserId))
        {
            return Result<ResponserDto>.Failure("Invalid responser ID.");
        }

        if (request.Responser == null)
        {
            return Result<ResponserDto>.Failure("Responser data is required.");
        }

        var responser = await _context.Responsers.FirstOrDefaultAsync(x => x.Id == request.ResponserId, cancellationToken);
        if (responser == null)
        {
            return Result<ResponserDto>.Failure("Responser not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Responser.Name))
        {
            return Result<ResponserDto>.Failure("Responser name is required.");
        }

        var name = request.Responser.Name.Trim();
        var duplicate = await _context.Responsers.AnyAsync(x => x.Id != request.ResponserId && x.Name == name, cancellationToken);
        if (duplicate)
        {
            return Result<ResponserDto>.Failure("Responser already exists.");
        }

        responser.Name = name;
        responser.PhoneNumber = request.Responser.PhoneNumber?.Trim() ?? string.Empty;
        responser.Email = request.Responser.Email?.Trim() ?? string.Empty;
        responser.UpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<ResponserDto>.Success(_mapper.Map<ResponserDto>(responser));
    }
}
