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
    public SchoolDbContext(DbContextOptions<SchoolDbContext> options) : base(options)
    {
    }

    public DbSet<AppRole> AppRoles { get; set; }
    public DbSet<AppUserRole> AppUserRoles { get; set; }
    public DbSet<Permission> Permissions { get; set; }
    public DbSet<AppRolePermission> RolePermissions { get; set; }
    public DbSet<ClassRoom> Classes { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<OutReach> OutReaches { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Quality> Qualities { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<Product> Products{ get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Brand> Brands { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Donor> Donors { get; set; }
    public DbSet<Responser> Responsers { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Member> Members{ get; set; }
    public DbSet<Purchase> Purchases { get; set; }
    public DbSet<PurchaseItem> PurchaseItems { get; set; }
    public DbSet<Person> Persons { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }
    public DbSet<AssetAssignment> AssetAssignments { get; set; }
    public DbSet<AssetTransfer> AssetTransfers { get; set; }
    public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }
    public DbSet<WriteOff> WriteOffs { get; set; }
    public DbSet<SystemSetting> SystemSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ── Purchase Relationships ───────────────────────────────────────
        // When a Purchase is deleted, automatically delete its PurchaseItems
        builder.Entity<PurchaseItem>()
            .HasOne(pi => pi.Purchase)
            .WithMany(p => p.PurchaseItems)
            .HasForeignKey(pi => pi.PurchaseId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Stock Movement Relationships ─────────────────────────────────
        builder.Entity<StockMovement>()
            .HasOne(sm => sm.FromPerson)
            .WithMany()
            .HasForeignKey(sm => sm.FromPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StockMovement>()
            .HasOne(sm => sm.ToPerson)
            .WithMany()
            .HasForeignKey(sm => sm.ToPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StockMovement>()
            .HasOne(sm => sm.MovedBy)
            .WithMany()
            .HasForeignKey(sm => sm.MovedById)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Asset Assignment Relationships ───────────────────────────────
        builder.Entity<AssetAssignment>()
            .HasOne(aa => aa.AssignedTo)
            .WithMany()
            .HasForeignKey(aa => aa.AssignedToId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AssetAssignment>()
            .HasOne(aa => aa.AssignedBy)
            .WithMany()
            .HasForeignKey(aa => aa.AssignedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AssetAssignment>()
            .HasOne(aa => aa.ReturnedTo)
            .WithMany()
            .HasForeignKey(aa => aa.ReturnedToId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Asset Transfer Relationships ─────────────────────────────────
        builder.Entity<AssetTransfer>()
            .HasOne(at => at.FromPerson)
            .WithMany()
            .HasForeignKey(at => at.FromPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AssetTransfer>()
            .HasOne(at => at.ToPerson)
            .WithMany()
            .HasForeignKey(at => at.ToPersonId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AssetTransfer>()
            .HasOne(at => at.InitiatedBy)
            .WithMany()
            .HasForeignKey(at => at.InitiatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<AssetTransfer>()
            .HasOne(at => at.AcknowledgedBy)
            .WithMany()
            .HasForeignKey(at => at.AcknowledgedById)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Maintenance Record Relationships ─────────────────────────────
        builder.Entity<MaintenanceRecord>()
            .HasOne(mr => mr.Technician)
            .WithMany()
            .HasForeignKey(mr => mr.TechnicianId)
            .OnDelete(DeleteBehavior.Restrict);
        // ── Category JSON Mappings ───────────────────────────────────────
        builder.Entity<Category>()
            .OwnsMany(c => c.AttributeSchema, a =>
            {
                a.ToJson();
            });

        builder.Entity<AppRolePermission>()
            .HasKey(rp => new { rp.RoleId, rp.PermissionId });

        builder.Entity<AppRolePermission>()
            .HasOne(rp => rp.Role)
            .WithMany(r => r.RolePermissions)
            .HasForeignKey(rp => rp.RoleId);

        builder.Entity<AppRolePermission>()
            .HasOne(rp => rp.Permission)
            .WithMany(p => p.RolePermissions)
            .HasForeignKey(rp => rp.PermissionId);

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

        // One-to-one relationship: Product - ProductImage
        builder.Entity<ProductImage>()
            .HasOne(pi => pi.Product)
            .WithOne(p => p.Image)
            .HasForeignKey<ProductImage>(pi => pi.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }

}
  