using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using SchoolAPI.Entities;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Application.Common.Interfaces;

namespace SchoolAPI.Data;

public class SchoolDbContext : IdentityDbContext<AppUser, AppRole,
string, IdentityUserClaim<string>, AppUserRole, IdentityUserLogin<string>,
 IdentityRoleClaim<string>, IdentityUserToken<string>>, IApplicationDbContext
{
    public SchoolDbContext(DbContextOptions options) : base(options)
    {
    }

    public DbSet<AppRole> AppRoles { get; set; }
    public DbSet<AppUserRole> AppUserRoles { get; set; }
    public DbSet<ClassRoom> Classes { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<OutReach> OutReaches { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Product> Products{ get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Brand> Brands { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Donor> Donors { get; set; }
    public DbSet<Responser> Responsers { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Member> Members{ get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUserRole>(entity =>
        {
            entity.HasOne(ur => ur.User)
                .WithMany()
                .HasForeignKey(ur => ur.UserId)
                .IsRequired();

            entity.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .IsRequired();
        });
    }

}
  