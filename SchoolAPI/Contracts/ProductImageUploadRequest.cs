using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts;

public class ProductImageUploadRequest
{
    [Required(ErrorMessage = "Image file is required.")]
    public IFormFile File { get; set; } = default!;
}