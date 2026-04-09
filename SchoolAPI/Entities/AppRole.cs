
using Microsoft.AspNetCore.Identity;

namespace SchoolAPI.Entities;

public class AppRole : IdentityRole
{
    public ICollection<AppRolePermission> RolePermissions { get; set; }
    public ICollection<AppUserRole> UserRoles { get; set; }
}

