using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Constant;
using SchoolAPI.Entities;

namespace SchoolAPI.Data;

public static class DbInitializer
{
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
}