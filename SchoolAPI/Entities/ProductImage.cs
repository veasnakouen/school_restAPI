namespace SchoolAPI.Entities;

public class ProductImage
{
    public int Id { get; set; }
    public string ProductId { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public string Url { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
