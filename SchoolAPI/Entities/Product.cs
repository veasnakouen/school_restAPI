namespace SchoolAPI.Entities;

public class Product : BaseEntity
{
    public string CodeNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public string? Donor { get; set; } = string.Empty;

    // public int QuantityInStock { get; set; }

    // One-to-one relationship with ProductImage
    public string? BrandId { get; set; }
    public Brand? Brand { get; set; }
    public string? CategoryId { get; set; }
    public Category? Category { get; set; }
    public ProductImage? Image { get; set; }
    public string? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string? QualityId { get; set; }
    public Quality? Quality { get; set; } 
}
