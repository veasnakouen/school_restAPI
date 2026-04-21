using System;

namespace SchoolAPI.Contracts;

public class StockMovementDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? PurchaseItemId { get; set; }
    public int Quantity { get; set; }
    public int QuantityBefore { get; set; }
    public int QuantityAfter { get; set; }
    public decimal UnitPriceAtMovement { get; set; }
    public string? FromLocation { get; set; }
    public string? ToLocation { get; set; }
    public string? Reason { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public DateTime MovedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
}