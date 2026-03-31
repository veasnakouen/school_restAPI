using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Donors.Delete;

public class DeleteDonorCommandHandler : IRequestHandler<DeleteDonorCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteDonorCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteDonorCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DonorId))
        {
            return Result.Failure("Invalid donor ID.");
        }

        var donor = await _context.Donors.FirstOrDefaultAsync(x => x.Id == request.DonorId, cancellationToken);
        if (donor == null)
        {
            return Result.Failure("Donor not found.");
        }

        _context.Donors.Remove(donor);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
