namespace SchoolAPI.Entities;

public class Quality
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public DateTime? CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? UpdateDate { get; set; }
}