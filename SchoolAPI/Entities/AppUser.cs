using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace SchoolAPI.Entities;//: physical file location

// public class AppUser:IdentityUser<int>
[Table("User")]
[Index(nameof(Id))]
[Index(nameof(FullName))]
// public class AppUser : IdentityUser<int>
public class AppUser : IdentityUser
{
    // todo: when we implement form IdentityUser we can leave the body blank ::> public class AppUser:IdentityUser{leave blank}
    // public string Id { get; set; } = Guid.NewGuid().ToString();
    // public required string  DisplayName { get; set; }
    // public string DisplayName { get; set; }
    // public required string Email { get; set; }

    // [PersonalData]
    // [Column(TypeName = "nvarchar(150)")]
    public string? FullName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string RefreshToken { get; set; }
   
    public DateTime RefreshTokenExpiryTime { get; set; } = DateTime.UtcNow; //standard international time format(use anywhere in the world.)

    // public bool IsActivated { get; set; }
    // public ICollection<AppUserRole> UserRoles { get; set; }

}

