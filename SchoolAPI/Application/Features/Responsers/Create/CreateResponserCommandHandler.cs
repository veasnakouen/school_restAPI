using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Responsers.Create;

public class CreateResponserCommandHandler : IRequestHandler<CreateResponserCommand, Result<ResponserDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CreateResponserCommandHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<ResponserDto>> Handle(CreateResponserCommand request, CancellationToken cancellationToken)
    {
        if (request.Responser == null)
        {
            return Result<ResponserDto>.Failure("Responser data is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Responser.Name))
        {
            return Result<ResponserDto>.Failure("Responser name is required.");
        }

        var name = request.Responser.Name.Trim();
        var exists = await _context.Responsers.AnyAsync(x => x.Name == name, cancellationToken);
        if (exists)
        {
            return Result<ResponserDto>.Failure("Responser already exists.");
        }

        var responser = _mapper.Map<Responser>(request.Responser);
        responser.Id = Guid.NewGuid().ToString();
        responser.Name = name;
        responser.PhoneNumber = request.Responser.PhoneNumber?.Trim() ?? string.Empty;
        responser.Email = request.Responser.Email?.Trim() ?? string.Empty;
        responser.CreatedDate = DateTime.UtcNow;
        responser.UpdateDate = null;

        _context.Responsers.Add(responser);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<ResponserDto>.Success(_mapper.Map<ResponserDto>(responser));
    }
}
