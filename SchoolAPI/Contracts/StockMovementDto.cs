using System;

namespace SchoolAPI.Contracts;

public class StockMovementDto
{
    public Guid Id { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public int QuantityBefore { get; set; }
    public int QuantityAfter { get; set; }
    public string? FromLocation { get; set; }
    public string? ToLocation { get; set; }
    public string? FromPersonName { get; set; }
    public string? ToPersonName { get; set; }
    public string? MovedByName { get; set; }
    public string? Reason { get; set; }
    public string? ReferenceNumber { get; set; }
    public DateTime MovedAt { get; set; }
}