namespace SchoolAPI.Entities;

// ─────────────────────────────────────────
// Person (Responsible Person)
// ─────────────────────────────────────────
public class Person
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<AssetAssignment> AssignedAssets { get; set; } = [];
}