using Microsoft.AspNetCore.Identity;

namespace SchoolAPI.Entities;

public class AppUser : IdentityUser<int>
{
    public string FullName{ get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string RefreshToken { get; set; }    public DateTime RefreshTokenExpiryTime { get; set; } = DateTime.UtcNow; //standard international time format(use anywhere in the world.)
}

