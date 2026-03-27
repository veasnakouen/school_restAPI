
using Microsoft.AspNetCore.Identity;

namespace SchoolAPI.Entities;

// Using string-based Id to match IdentityUser (default)
public class AppRole : IdentityRole
{
    public ICollection<AppUserRole> UserRoles { get; set; }
}

