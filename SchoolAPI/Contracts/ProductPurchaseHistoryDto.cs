namespace SchoolAPI.Contracts;

public class ProductPurchaseHistoryDto
{
    public string PurchaseId { get; set; } = string.Empty;
    public string PurchaseDate { get; set; } = string.Empty;
    public string? VoucherNumber { get; set; }
    public string? SupplierName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}