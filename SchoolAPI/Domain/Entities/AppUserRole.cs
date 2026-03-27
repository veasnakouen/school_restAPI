using Microsoft.AspNetCore.Identity;

namespace SchoolAPI.Entities;

public class AppUserRole : IdentityUserRole<string>
{
    public AppUser User { get; set; }
    public AppRole Role { get; set; }
}