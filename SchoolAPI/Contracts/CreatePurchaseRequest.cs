using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts;

public class CreatePurchaseRequest
{
    [Required]
    public string SupplierId { get; set; } = string.Empty;
    public string? ReferenceNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "Completed";
    
    [Required, MinLength(1, ErrorMessage = "At least one item is required to make a purchase.")]
    public List<PurchaseItemRequest> Items { get; set; } = new();
}