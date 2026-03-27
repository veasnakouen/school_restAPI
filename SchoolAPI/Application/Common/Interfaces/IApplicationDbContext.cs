#nullable enable

using Microsoft.EntityFrameworkCore;
using MediatR;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<AppUser> UserSet { get; }
    DbSet<ClassRoom> ClassSet { get; }
    DbSet<Student> StudentSet { get; }
    DbSet<OutReach> OutReachSet { get; }
    DbSet<Attendance> AttendanceSet { get; }
    
    IQueryable<AppUser> Users { get; }
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
