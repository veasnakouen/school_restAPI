using System;

namespace SchoolAPI.Contracts;

public class ProductPurchaseHistoryDto
{
    public string PurchaseId { get; set; }
    public DateTime PurchaseDate { get; set; }
    public string? VoucherNumber { get; set; }
    public string? SupplierName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}