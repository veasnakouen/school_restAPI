using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using SchoolAPI.Entities;
using Microsoft.AspNetCore.Identity;

namespace SchoolAPI.Data;

public class SchoolDbContext(DbContextOptions option) : IdentityDbContext<AppUser, AppRole, string>(option)
{
    public DbSet<AppUser> AppUsers { get; set; } = null!;
    public DbSet<ClassRoom> Classes { get; set; } = null!;
    public DbSet<Student> Students { get; set; } = null!;
    public DbSet<OutReach> OutReach { get; set; } = null!;
    public DbSet<Attendance> Attendances { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<Member> Members { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>().ToTable("Users");
        builder.Entity<AppRole>().ToTable("Roles");
        builder.Entity<AppUserRole>().ToTable("UserRoles");

        // Configure relationships
        builder.Entity<AppUserRole>()
            .HasOne(ur => ur.User)
            .WithMany()
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<AppUserRole>()
            .HasOne(ur => ur.Role)
            .WithMany()
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
