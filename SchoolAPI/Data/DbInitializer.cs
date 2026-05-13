using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Constant;
using SchoolAPI.Entities;
using System.Security.Claims;
using System.Text.Json;

namespace SchoolAPI.Data;

public static class DbInitializer
{
    public static async Task InitializeDatabaseAsync(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SchoolDbContext>() 
            ?? throw new InvalidOperationException("Failed to get SchoolDbContext from service provider.");
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<SchoolDbContext>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();

        try
        {
            logger.LogInformation("Initializing and ensuring database exists...");

            // 🚀 RAPID DEVELOPMENT MODE:
            // WARNING: This completely deletes the database on startup to guarantee a clean slate.
            // Use this just once to fix the schema, then comment it out!
            // await context.Database.EnsureDeletedAsync();
            
            // In Production, we use MigrateAsync() to apply pending EF Core migrations.
            // This ensures the database schema is always up-to-date with the code.
            // In Development, EnsureCreatedAsync() can be faster if you don't use migrations.
            await context.Database.MigrateAsync();

            // Call all your seeders sequentially
            await SeedPermissionsAsync(context);
            await SeedRolesAndUsersAsync(userManager, roleManager, logger);
            
            // Assign Permissions to Roles (Claims)
            await AssignRolePermissionsAsync(context, roleManager);

            await SeedClassesAsync(context);
            await SeedStudentsAsync(context);
            // await SeedInventoryDataAsync(context); // Commented out to prevent fake data
            
            logger.LogInformation("Starting Excel data import...");
            // DbInitialize.SeedExcelData(context);

            logger.LogInformation("Database initialized and seeded successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database.");
        }
    }

    public static async Task SeedPermissionsAsync(SchoolDbContext context)
    {
        // Get all permission fields from Permissions.cs
        var permissionFields = typeof(Permissions)
            .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
            .Where(f => f.FieldType == typeof(string) && f.Name != nameof(Permissions.ClaimType))
            .Select(f => (string)f.GetValue(null))
            .ToList();

        foreach (var perm in permissionFields)
        {
            if (!await context.Permissions.AnyAsync(p => p.Name == perm))
            {
                context.Permissions.Add(new Permission { Name = perm });
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedRolesAndUsersAsync(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager, ILogger logger)
    {
        // 1. Seed Default Roles
        var roles = new[] { "SuperAdmin", "Admin", "User", "DataEntry", "Teacher", "Inventory", "InventoryViewer" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new AppRole { Name = role });
            }
        }

        // 2. Seed Default Users
        await CreateUserWithRoleAsync(userManager, "superadmin", "superadmin@school.com", "Super Administrator", "Admin123!", "SuperAdmin", logger);
        await CreateUserWithRoleAsync(userManager, "admin", "admin@school.com", "System Administrator", "Admin123!", "Admin", logger);
        await CreateUserWithRoleAsync(userManager, "inventory", "inventory@school.com", "Inventory Manager", "Password123!", "Inventory", logger);
        await CreateUserWithRoleAsync(userManager, "viewer", "viewer@school.com", "Inventory Viewer", "Password123!", "InventoryViewer", logger);
    }

    private static async Task CreateUserWithRoleAsync(UserManager<AppUser> userManager, string userName, string email, string fullName, string password, string role, ILogger logger)
    {
        if (await userManager.FindByEmailAsync(email) == null)
        {
            var adminUser = new AppUser
            {
                UserName = userName,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, role);
                logger.LogInformation("{Role} user created successfully.", role);
            }
            else
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                logger.LogWarning("Failed to create {Role} user. Reasons: {Errors}", role, errors);
            }
        }
    }

    private static async Task AssignRolePermissionsAsync(SchoolDbContext context, RoleManager<AppRole> roleManager)
    {
        var permissions = await context.Permissions.Select(p => p.Name).ToListAsync();

        await EnsureRolePermissionsAsync(roleManager, "Admin", permissions);
        await EnsureRolePermissionsAsync(roleManager, "SuperAdmin", permissions);
        await EnsureRolePermissionsAsync(roleManager, "DataEntry", Permissions.GetDefaultPermissionsForRole("DataEntry"));
        await EnsureRolePermissionsAsync(roleManager, "Teacher", Permissions.GetDefaultPermissionsForRole("Teacher"));
        await EnsureRolePermissionsAsync(roleManager, "Inventory", Permissions.GetDefaultPermissionsForRole("Inventory"));
        await EnsureRolePermissionsAsync(roleManager, "InventoryViewer", Permissions.GetDefaultPermissionsForRole("InventoryViewer"));
    }

    private static async Task EnsureRolePermissionsAsync(RoleManager<AppRole> roleManager, string roleName, IEnumerable<string> permissions)
    {
        var role = await roleManager.FindByNameAsync(roleName);
        if (role == null) return;

        var existingClaims = await roleManager.GetClaimsAsync(role);
        foreach (var permission in permissions.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (!existingClaims.Any(x => x.Type == Permissions.ClaimType && x.Value == permission))
            {
                await roleManager.AddClaimAsync(role, new Claim(Permissions.ClaimType, permission));
            }
        }
    }

    private static async Task SeedStudentsAsync(SchoolDbContext context)
    {
        if (await context.Students.AnyAsync()) return; // DB has been seeded

        var student = new Student
        {
            KhFirstName = "សុខ",
            KhLastName = "សុវណ្ណ",
            EngFirstName = "Sok",
            EngLastName = "Sovann",
        };

        context.Students.Add(student);
        await context.SaveChangesAsync();
    }

    private static async Task SeedClassesAsync(SchoolDbContext context)
    {
        if (await context.Classes.AnyAsync()) return;

        var classes = new List<ClassRoom>
        {
            new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 1A" },
            new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 1B" },
            new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 2A" },
            new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 2B" },
            new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 3A" },
            new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 3B" }
        };

        await context.Classes.AddRangeAsync(classes);
        await context.SaveChangesAsync();
    }

    private static async Task SeedInventoryDataAsync(SchoolDbContext context)
    {
        if (await context.Products.AnyAsync()) return;

        var electronicsCategory = new Category { Id = Guid.NewGuid().ToString(), Name = "Electronics", Description = "Electronic devices and accessories" };
        var furnitureCategory = new Category { Id = Guid.NewGuid().ToString(), Name = "Furniture", Description = "Office and home furniture" };

        var appleBrand = new Brand { Id = Guid.NewGuid().ToString(), Name = "Apple" };
        var hermanBrand = new Brand { Id = Guid.NewGuid().ToString(), Name = "Herman Miller" };

        var newQuality = new Quality { Id = Guid.NewGuid().ToString(), Name = "Brand New" };
        var usedQuality = new Quality { Id = Guid.NewGuid().ToString(), Name = "Lightly Used" };

        var itDepartment = new Department { Id = Guid.NewGuid().ToString(), Name = "IT Department", Location = "Information Technology" };
        var hrDepartment = new Department { Id = Guid.NewGuid().ToString(), Name = "HR Department", Location = "Human Resources" };

        await context.Categories.AddRangeAsync(electronicsCategory, furnitureCategory);
        await context.Brands.AddRangeAsync(appleBrand, hermanBrand);
        await context.Qualities.AddRangeAsync(newQuality, usedQuality);
        await context.Departments.AddRangeAsync(itDepartment, hrDepartment);

        var products = new List<Product>
        {
            new Product
            {
                Id = Guid.NewGuid().ToString(),
                ProductName = "MacBook Pro 16-inch",
                Description = "High-performance laptop for developers and designers.",
                Price = 2499.00m,
                CodeNumber = "MBP-16-M3",
                CategoryId = electronicsCategory.Id,
                BrandId = appleBrand.Id,
                QualityId = newQuality.Id
            },
            new Product
            {
                Id = Guid.NewGuid().ToString(),
                ProductName = "Aeron Office Chair",
                Description = "Ergonomic mesh office chair.",
                Price = 1250.00m,
                CodeNumber = "HM-AERON",
                CategoryId = furnitureCategory.Id,
                BrandId = hermanBrand.Id,
                QualityId = usedQuality.Id
            }
        };

        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();
    }
}