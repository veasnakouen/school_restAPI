using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Departments.Delete;

public class DeleteDepartmentCommandHandler : IRequestHandler<DeleteDepartmentCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteDepartmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteDepartmentCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DepartmentId))
        {
            return Result.Failure("Invalid department ID.");
        }

        var department = await _context.Departments.FirstOrDefaultAsync(x => x.Id == request.DepartmentId, cancellationToken);
        if (department == null)
        {
            return Result.Failure("Department not found.");
        }

        _context.Departments.Remove(department);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
