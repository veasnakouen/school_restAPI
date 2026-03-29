using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using SchoolAPI.Entities;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Controllers;
namespace SchoolAPI.Data;

#region comments
// public class SchoolDbContext : DbContext
// public class SchoolDbContext(DbContextOptions options) : IdentityDbContext<AppUser>(options)
// 🪧 we use this (below) one if our AppUser inherit from IdentityUser<int> (specify with "int" type )
// public class SchoolDbContext(DbContextOptions options): IdentityDbContext<AppUser, AppRole, int,
//  IdentityUserClaim<int>, AppUserRole, IdentityUserLogin<int>,
//  IdentityRoleClaim<int>, IdentityUserToken<int>>(options)
#endregion
public class SchoolDbContext(DbContextOptions option) : IdentityDbContext<AppUser, AppRole, string>(option)
{
    #region comments
    // with the older version of c# we use constructor to pass the options to the base class
    // public SchoolDbContext(DbContextOptions option) : base(option) { }

    //we create DbSet for each entity, to make it entity to be a table in database and easy to query
    // syntax: public DbSet<EntityType> PropertyName { get; set; } ("PropertyName" will be the table name in the database)
    #endregion
    public DbSet<AppUser> AppUsers { get; set; }
    public DbSet<ClassRoom> Classes { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<OutReach> OutReach { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Product> Products{ get; set; }
    public DbSet<Member> Members{ get; set; }

    // Todo: do checking the usage of this 
    // with this method we can customize the table name and other properties of the table 
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // 
        builder.Entity<AppUser>().ToTable("Users");
        builder.Entity<AppRole>().ToTable("Roles");
        builder.Entity<AppUserRole>().ToTable("UserRoles");
        #region Comments_Section
        // .Property(u => u.Gender)
        // .HasConversion<string>();//Store text , e.g., 'Male','Female

        //Sample code for Seeding Role, if roles not exist entity framework core migration will add this data to database   
        // var writerRoleId = "MT-003-ekf-sdf";
        // var readerRoleId = "MT-003--read";
        // var roles = new List<IdentityRole>
        // {
        //     new IdentityRole{
        //         Id=writerRoleId,
        //         Name="Writer",
        //         NormalizedName="Writer".ToUpper()
        //         ConcurrencyStamp = writerRoleId,
        //         },
        //     new IdentityRole{
        //         Id=writerRoleId,
        //         Name="Reader",
        //         NormalizedName="Reader".ToUpper()
        //         ConcurrencyStamp = readerRoleId,
        //         },
        // };

        // builder.Entity<IdentityRole>().HasData(roles);
        #endregion

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
