using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Constant;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using System.Security.Claims;

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
            await dbContext.Database.MigrateAsync();

            var roleManager = services.GetRequiredService<RoleManager<AppRole>>();
            var userManager = services.GetRequiredService<UserManager<AppUser>>();

            // 2. Seed Roles
            foreach (var roleName in new[] { Constant.Roles.User, Constant.Roles.Admin, Constant.Roles.DataEntry, Constant.Roles.Teacher })
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
            var adminPassword = configuration["SeedAdmin:Password"];
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

            await EnsureRolePermissionsAsync(roleManager, Constant.Roles.Admin, Permissions.GetDefaultPermissionsForRole(Constant.Roles.Admin));
            await EnsureRolePermissionsAsync(roleManager, Constant.Roles.DataEntry, Permissions.GetDefaultPermissionsForRole(Constant.Roles.DataEntry));
            await EnsureRolePermissionsAsync(roleManager, Constant.Roles.Teacher, Permissions.GetDefaultPermissionsForRole(Constant.Roles.Teacher));
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