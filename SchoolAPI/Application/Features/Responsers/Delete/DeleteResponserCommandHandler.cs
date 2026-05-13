using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Responsers.Delete;

public class DeleteResponserCommandHandler : IRequestHandler<DeleteResponserCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteResponserCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteResponserCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ResponserId))
        {
            return Result.Failure("Invalid responser ID.");
        }

        var responser = await _context.Responsers.FirstOrDefaultAsync(x => x.Id == request.ResponserId, cancellationToken);
        if (responser == null)
        {
            return Result.Failure("Responser not found.");
        }

        _context.Responsers.Remove(responser);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
