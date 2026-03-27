using MediatR;

namespace SchoolAPI.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    IQueryable<ClassRoom> Classes { get; }
    IQueryable<Student> Students { get; }
    IQueryable<OutReach> OutReaches { get; }
    IQueryable<Attendance> Attendances { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
}
