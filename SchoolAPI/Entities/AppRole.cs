
using Microsoft.AspNetCore.Identity;

namespace SchoolAPI.Entities;

// with role should use this one, IdentityRole<int>
public class AppRole : IdentityRole<int>
{
    public ICollection<AppUserRole> UserRoles { get; set; }
}

