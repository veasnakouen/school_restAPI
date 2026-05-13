namespace SchoolAPI.Entities;

public abstract class BaseAuditableEntity : BaseEntity
{
    public DateTime? CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? UpdateDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}