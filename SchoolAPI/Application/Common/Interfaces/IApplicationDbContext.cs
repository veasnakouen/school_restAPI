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
    DbSet<Purchase> Purchases { get; }
    DbSet<PurchaseItem> PurchaseItems { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<Category> Categories { get; }
    DbSet<Quality> Qualities { get; }
    DbSet<Supplier> Suppliers { get; }
    DbSet<Brand> Brands { get; }
    DbSet<Department> Departments { get; }
    DbSet<Donor> Donors { get; }
    DbSet<Responser> Responsers { get; }
    DbSet<Transaction> Transactions { get; }
    DbSet<Person> Persons { get; }
    DbSet<StockMovement> StockMovements { get; }
    DbSet<AssetAssignment> AssetAssignments { get; }
    DbSet<AssetTransfer> AssetTransfers { get; }
    DbSet<MaintenanceRecord> MaintenanceRecords { get; }
    DbSet<WriteOff> WriteOffs { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<AppUserRole> UserRoles { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
}
