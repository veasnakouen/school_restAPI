using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.DTOs;

namespace SchoolAPI.Application.Features.Classes.GetAll;

public class GetAllClassesQueryHandler : IRequestHandler<GetAllClassesQuery, Result<List<ClassDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetAllClassesQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<ClassDto>>> Handle(GetAllClassesQuery request, CancellationToken cancellationToken)
    {
        var classes = await _context.Classes
            .Include(c => c.Students)
            .ToListAsync(cancellationToken);

        var classDtos = _mapper.Map<List<ClassDto>>(classes);
        return Result<List<ClassDto>>.Success(classDtos);
    }
}
