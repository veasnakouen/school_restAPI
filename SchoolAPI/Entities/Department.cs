namespace SchoolAPI.Entities;

public class Department : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
}