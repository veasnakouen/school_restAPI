namespace SchoolAPI.Entities;

public class Supplier : BaseAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public List<string>? ContactInfo { get; set; } = new List<string>();
    public string? Address { get; set; } 

    // Navigation property for related products
    public ICollection<Product>? Products { get; set; } = new List<Product>();

    // Navigation property for related purchases
    public ICollection<Purchase>? Purchases { get; set; } = new List<Purchase>();
}