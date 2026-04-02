namespace SchoolAPI.Entities;

public class Product : BaseEntity
{
    public string CodeNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public Category Category { get; set; } = null!;
    public string BrandId { get; set; } = string.Empty;
    public Brand Brand { get; set; } = null!;
    public decimal? Price { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? ImagePublicId { get; set; }
    public string Quality { get; set; } = string.Empty;
    public string VoucherNumber { get; set; } = string.Empty;
}