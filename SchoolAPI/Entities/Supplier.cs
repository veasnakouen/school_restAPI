namespace SchoolAPI.Entities;

public class Supplier : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public List<string>? ContactInfo { get; set; } = new List<string>();
    public string? Address { get; set; } 

    // Navigation property for related products
    public ICollection<Product>? Products { get; set; } = new List<Product>();
}