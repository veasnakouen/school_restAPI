using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.DTOs;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Classes.GetById;

public class GetClassByIdQueryHandler : IRequestHandler<GetClassByIdQuery, Result<ClassDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetClassByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<ClassDto>> Handle(GetClassByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.ClassId == Guid.Empty)
        {
            return Result<ClassDto>.Failure("Invalid class ID.");
        }

        var classRoom = await _context.Classes
            .Include(c => c.Students)
            .FirstOrDefaultAsync(c => c.Id == request.ClassId, cancellationToken);

        if (classRoom == null)
        {
            return Result<ClassDto>.Failure("Class not found.");
        }

        var classDto = _mapper.Map<ClassDto>(classRoom);
        return Result<ClassDto>.Success(classDto);
    }
}
