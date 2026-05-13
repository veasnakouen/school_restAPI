using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts;

public class BrandDto
{
    public string? Id { get; set; }

    [Required(ErrorMessage = "The field Name is required")]
    [MinLength(2, ErrorMessage = "The name field must have at least 2 characters.")]
    public string Name { get; set; } = string.Empty;

    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdateDate { get; set; }
}
