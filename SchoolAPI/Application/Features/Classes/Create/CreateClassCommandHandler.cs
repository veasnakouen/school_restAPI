using MediatR;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Domain.Entities;

namespace SchoolAPI.Application.Features.Classes.Create;

public class CreateClassCommandHandler : IRequestHandler<CreateClassCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateClassCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateClassCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ClassName))
        {
            return Result<Guid>.Failure("Class name is required.");
        }

        var classRoom = new ClassRoom
        {
            Id = Guid.NewGuid(),
            ClassName = request.ClassName
        };

        _context.Classes.Add(classRoom);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(classRoom.Id);
    }
}
