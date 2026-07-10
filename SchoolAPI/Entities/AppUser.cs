using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolAPI.Entities;
public class AppUser : IdentityUser
{
    public required string FullName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime RefreshTokenExpiryTime { get; set; } = DateTime.UtcNow; //standard international time format(use anywhere in the world.)

    // ─── Link to Operational Data ──────────────────────────────────
    // This links the authentication user to the operational "Person" entity
    // used in asset tracking, etc.
    public Guid? PersonId { get; set; }
    [ForeignKey(nameof(PersonId))]
    public Person? Person { get; set; }
}
