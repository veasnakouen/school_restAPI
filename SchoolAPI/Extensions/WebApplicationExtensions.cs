using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SchoolAPI.Authorization;
using SchoolAPI.Constant;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SchoolAPI.Extensions
{
    public static class WebApplicationExtensions
    {
        public static async Task SeedDataAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var services = scope.ServiceProvider;
            var configuration = services.GetRequiredService<IConfiguration>();

            // 1. Apply pending migrations first
            var dbContext = services.GetRequiredService<SchoolDbContext>();

            try
            {
                await dbContext.Database.MigrateAsync();
            }
            catch (Exception ex)
            {
                app.Logger.LogError(ex, "An error occurred while migrating the database.");
                throw;
            }

            // 2. Seed Permissions and Register Policies
            await DbInitializer.SeedPermissionsAsync(dbContext);
            var permissions = await dbContext.Permissions.Select(p => p.Name).ToListAsync();
            var authorizationOptions = services.GetService<IOptions<Microsoft.AspNetCore.Authorization.AuthorizationOptions>>()?.Value;
            if (authorizationOptions != null)
            {
                foreach (var perm in permissions)
                {
                    if (authorizationOptions.GetPolicy(perm) == null)
                        authorizationOptions.AddPolicy(perm, policy => policy.Requirements.Add(new PermissionRequirement(perm)));
                }
            }

            var roleManager = services.GetRequiredService<RoleManager<AppRole>>();
            var userManager = services.GetRequiredService<UserManager<AppUser>>();

            // 3. Seed Roles
            foreach (var roleName in new[] { "SuperAdmin", Constant.Roles.User, Constant.Roles.Admin, Constant.Roles.DataEntry, Constant.Roles.Teacher, "Inventory", "InventoryViewer" })
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var roleResult = await roleManager.CreateAsync(new AppRole { Name = roleName });
                    if (!roleResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Failed to create role '{roleName}': {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                    }
                }
            }

            // 3. Seed Admin User
            var adminEmail = "admin@school.com";
            var adminPassword = configuration["SeedAdmin:Password"] ?? "Admin@123";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null && !string.IsNullOrWhiteSpace(adminPassword))
            {
                adminUser = new AppUser
                {
                    UserName = "admin",
                    Email = adminEmail,
                    FullName = "Admin User",
                    EmailConfirmed = true
                };
                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to create admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }

            if (adminUser == null)
            {
                return;
            }

            // 4. Assign Admin role
            if (!await userManager.IsInRoleAsync(adminUser, Constant.Roles.Admin))
            {
                await userManager.AddToRoleAsync(adminUser, Constant.Roles.Admin);
            }

            // 5. Assign SuperAdmin role
            if (!await userManager.IsInRoleAsync(adminUser, "SuperAdmin"))
            {
                await userManager.AddToRoleAsync(adminUser, "SuperAdmin");
            }

            // 6. Seed Inventory Manager
            var inventoryUser = await userManager.FindByEmailAsync("inventory@school.com");
            if (inventoryUser == null)
            {
                inventoryUser = new AppUser { UserName = "inventory", Email = "inventory@school.com", FullName = "Inventory Manager", EmailConfirmed = true };
                await userManager.CreateAsync(inventoryUser, "Password123!");
                await userManager.AddToRoleAsync(inventoryUser, "Inventory");
            }

            // 7. Seed Inventory Viewer
            var viewerUser = await userManager.FindByEmailAsync("viewer@school.com");
            if (viewerUser == null)
            {
                viewerUser = new AppUser { UserName = "viewer", Email = "viewer@school.com", FullName = "Inventory Viewer", EmailConfirmed = true };
                await userManager.CreateAsync(viewerUser, "Password123!");
                await userManager.AddToRoleAsync(viewerUser, "InventoryViewer");
            }

            await EnsureRolePermissionsAsync(roleManager, Constant.Roles.Admin, permissions);
            await EnsureRolePermissionsAsync(roleManager, "SuperAdmin", permissions);
            await EnsureRolePermissionsAsync(roleManager, Constant.Roles.DataEntry, Permissions.GetDefaultPermissionsForRole(Constant.Roles.DataEntry));
            await EnsureRolePermissionsAsync(roleManager, Constant.Roles.Teacher, Permissions.GetDefaultPermissionsForRole(Constant.Roles.Teacher));
            await EnsureRolePermissionsAsync(roleManager, "Inventory", Permissions.GetDefaultPermissionsForRole("Inventory"));
            await EnsureRolePermissionsAsync(roleManager, "InventoryViewer", Permissions.GetDefaultPermissionsForRole("InventoryViewer"));

            // 5. Seed Sample Classes (only if no classes exist)
            if (!await dbContext.Classes.AnyAsync())
            {
                var classes = new List<ClassRoom>
                {
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 1A" },
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 1B" },
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 2A" },
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 2B" },
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 3A" },
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 3B" },
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 4A" },
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 4B" },
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 5A" },
                    new ClassRoom { Id = Guid.NewGuid(), ClassName = "Grade 5B" }
                };

                await dbContext.Classes.AddRangeAsync(classes);
                await dbContext.SaveChangesAsync();
            }

            // 6. Seed Sample Products and Related Lookups
            if (!await dbContext.Products.AnyAsync())
            {
                var electronicsCategory = new Category { Id = Guid.NewGuid().ToString(), Name = "Electronics", Description = "Electronic devices and accessories" };
                var furnitureCategory = new Category { Id = Guid.NewGuid().ToString(), Name = "Furniture", Description = "Office and home furniture" };

                var appleBrand = new Brand { Id = Guid.NewGuid().ToString(), Name = "Apple" };
                var hermanBrand = new Brand { Id = Guid.NewGuid().ToString(), Name = "Herman Miller" };

                var newQuality = new Quality { Id = Guid.NewGuid().ToString(), Name = "Brand New" };
                var usedQuality = new Quality { Id = Guid.NewGuid().ToString(), Name = "Lightly Used" };

                await dbContext.Categories.AddRangeAsync(electronicsCategory, furnitureCategory);
                await dbContext.Brands.AddRangeAsync(appleBrand, hermanBrand);
                await dbContext.Qualities.AddRangeAsync(newQuality, usedQuality);

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

                await dbContext.Products.AddRangeAsync(products);
                await dbContext.SaveChangesAsync();
            }
        }

        private static async Task EnsureRolePermissionsAsync(RoleManager<AppRole> roleManager, string roleName, IEnumerable<string> permissions)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role == null)
            {
                return;
            }

            var existingClaims = await roleManager.GetClaimsAsync(role);
            foreach (var permission in permissions.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                if (existingClaims.Any(x => x.Type == Permissions.ClaimType && x.Value == permission))
                {
                    continue;
                }

                await roleManager.AddClaimAsync(role, new Claim(Permissions.ClaimType, permission));
            }
        }
    }
}