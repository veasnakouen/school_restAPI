namespace SchoolAPI.Contracts;

public class PurchaseItemDto
{
    public string? Id { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}