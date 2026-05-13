namespace SchoolAPI.Contracts;

public class PurchaseDto
{
    public string? Id { get; set; }
    public string SupplierId { get; set; } = string.Empty;
    public string? SupplierName { get; set; }
    public string? ReferenceNumber { get; set; }
    public DateTime PurchaseDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<PurchaseItemDto> Items { get; set; } = new();
}