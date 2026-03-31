using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts;

public class ProductDto
{
    public string? Id { get; set; }

    [Required(ErrorMessage = "The field Name is required")]
    [MinLength(3, ErrorMessage = "The name field must have at least 3 characters.")]
    public string Name { get; set; } = string.Empty;

    public string? CodeNumber { get; set; }
    public string? Description { get; set; }
    public string? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? BrandId { get; set; }
    public string? BrandName { get; set; }
    public decimal? Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? Quality { get; set; }
    public string? VoucherNumber { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdateDate { get; set; }
}
