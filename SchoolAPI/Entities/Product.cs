namespace SchoolAPI.Entities;

public class Product : BaseEntity
{
    public string CodeNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public Category? Category { get; set; }
    public string? BrandId { get; set; }
    public Brand? Brand { get; set; }
    public decimal? Price { get; set; }
    // public int QuantityInStock { get; set; }
    
    // One-to-one relationship with ProductImage
    public ProductImage? Image { get; set; }
    
    public string Quality { get; set; } = string.Empty;
    public string VoucherNumber { get; set; } = string.Empty;
}