using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SchoolAPI.Constant;
using SchoolAPI.Data;
using SchoolAPI.Entities;
using Xunit;

namespace SchoolAPI.Tests.Authorization;

public class PermissionResolutionTests
{
    [Fact]
    public async Task FetchUserPermissions_Should_Combine_Role_And_Direct_Claims_Without_Duplicates()
    {
        // Arrange: Setup DI with an In-Memory Database
        var services = new ServiceCollection();

        services.AddDbContext<SchoolDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));

        // Register Identity so we can safely use the Managers instead of manual mapping classes
        services.AddIdentity<AppUser, AppRole>()
            .AddEntityFrameworkStores<SchoolDbContext>();
        
        services.AddLogging();

        var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SchoolDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();

        // 1. Seed User and Role via Managers
        var user = new AppUser { Id = Guid.NewGuid().ToString(), UserName = "testuser" };
        await userManager.CreateAsync(user);
        
        var role = new AppRole { Id = Guid.NewGuid().ToString(), Name = "Manager" };
        await roleManager.CreateAsync(role);
        
        await userManager.AddToRoleAsync(user, "Manager");

        // 2. Seed a Role Claim
        await roleManager.AddClaimAsync(role, new Claim(Permissions.ClaimType, "Product.Create"));

        // 3. Seed Direct User Claims (We intentionally add Product.Create again to test .Distinct())
        await userManager.AddClaimAsync(user, new Claim(Permissions.ClaimType, "Product.Create"));
        await userManager.AddClaimAsync(user, new Claim(Permissions.ClaimType, "Product.Update"));

        // Act: Execute the exact EF Core query used in your PermissionHandler
        var rolePermissions = await context.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Join(context.RoleClaims, ur => ur.RoleId, rc => rc.RoleId, (ur, rc) => rc)
            .Where(rc => rc.ClaimType == Permissions.ClaimType)
            .Select(rc => rc.ClaimValue)
            .ToListAsync();

        var directUserPermissions = await context.UserClaims
            .Where(uc => uc.UserId == user.Id && uc.ClaimType == Permissions.ClaimType)
            .Select(uc => uc.ClaimValue)
            .ToListAsync();

        var resolvedPermissions = rolePermissions.Concat(directUserPermissions).Distinct().ToList();

        // Assert
        Assert.Contains("Product.Create", resolvedPermissions);
        Assert.Contains("Product.Update", resolvedPermissions);
        
        // Should only be 2 permissions total (ProductCreate should not be duplicated)
        Assert.Equal(2, resolvedPermissions.Count);
    }
}