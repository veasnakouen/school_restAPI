using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<ClassRoom> Classes { get; }
    DbSet<Student> Students { get; }
    DbSet<OutReach> OutReaches { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<Category> Categories { get; }
    DbSet<Brand> Brands { get; }
    DbSet<Department> Departments { get; }
    DbSet<Donor> Donors { get; }
    DbSet<Responser> Responsers { get; }
    DbSet<Transaction> Transactions { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
}
