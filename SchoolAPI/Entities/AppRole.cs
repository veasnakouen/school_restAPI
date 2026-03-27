
using Microsoft.AspNetCore.Identity;
using SchoolAPI.Entities;

namespace schoolAPI.Entities;

public class AppRole : IdentityRole
{
    public ICollection<AppUserRole> UserRoles { get; set; }
}

