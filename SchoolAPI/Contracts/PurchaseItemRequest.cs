using System.ComponentModel.DataAnnotations;

namespace SchoolAPI.Contracts;

public class PurchaseItemRequest
{
    [Required]
    public string ProductId { get; set; } = string.Empty;
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; }
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0.")]
    public decimal UnitPrice { get; set; }
}