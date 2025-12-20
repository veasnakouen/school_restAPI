using AutoMapper;
using MediatR;
using SchoolAPI.Data;
using SchoolAPI.Entities;

namespace SchoolAPI.Features.CreateClass;

public class CreateClassCommandHandler : IRequestHandler<CreateClassCommand, Guid>
{
    private readonly SchoolDbContext _context;
    private readonly IMapper _mapper;

    public CreateClassCommandHandler(SchoolDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Guid> Handle(CreateClassCommand request, CancellationToken cancellationToken)
    {

        var newClass = _mapper.Map<ClassRoom>(request);
        _context.Classes.Add(newClass);
        await _context.SaveChangesAsync(cancellationToken);
        return newClass.Id;
    }
}    
