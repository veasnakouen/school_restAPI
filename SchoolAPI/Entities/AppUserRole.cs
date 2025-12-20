using Microsoft.AspNetCore.Identity;

namespace SchoolAPI.Entities;

public class AppUserRole :IdentityUserRole<int>
{
    public AppUser User { get; set; }
    public AppRole Role { get; set; }
}