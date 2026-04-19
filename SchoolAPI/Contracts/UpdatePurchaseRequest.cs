using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts;

public class UpdatePurchaseRequest
{
    public string? SupplierId { get; set; }
    public string? ReferenceNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public string? Notes { get; set; }
    public string? Status { get; set; }
    [Required, MinLength(1, ErrorMessage = "At least one item is required to update a purchase.")]
    public List<PurchaseItemRequest> Items { get; set; } = new();
}