using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace SchoolAPI.Contracts;

public class ProductDto
{
    public string? Id { get; set; }

    [Required(ErrorMessage = "The field Name is required")]
    [MinLength(3, ErrorMessage = "The name field must have at least 3 characters.")]
    public string Name { get; set; } = string.Empty;

    public string? CodeNumber { get; set; }
    public string? Attributes { get; set; }
    public string? Description { get; set; }
    public string? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? BrandId { get; set; }
    public string? BrandName { get; set; }
    public string? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public decimal? Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? QualityId { get; set; }
    public string? Quality { get; set; }
    public DateTime? CreatedAt { get; set; }
    public List<ProductPurchaseHistoryDto>? PurchaseHistory { get; set; }
    public string? PlateNumber { get; set; }
    public string? EngineNumber { get; set; }
    public DateTime? Year { get; set; }
    // Acquisition / Initial Stock Fields (Used only during creation)
    public string? PurchaseType { get; set; } // "None", "Purchased", "Donated"
    public int? InitialQuantity { get; set; }
    public string? SupplierName { get; set; }
    public string? SupplierContact { get; set; }
    public string? DonorName { get; set; }
    public string? VoucherNumber { get; set; }
    public DateTime? InvoiceDate { get; set; }
    public string? ResponsiblePerson { get; set; }
}
 