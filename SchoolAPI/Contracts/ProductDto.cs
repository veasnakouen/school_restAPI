using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts;

public class ProductDto
{
    [Required(ErrorMessage = "The field Name is required")]
    [MinLength(3, ErrorMessage = "The name field must have at least 3 characters.")]
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; } = string.Empty;
}
