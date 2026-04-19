using System;

namespace SchoolAPI.Contracts;

public class AssetTransferDto
{
    public Guid Id { get; set; }
    public string TransferNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public string? FromLocation { get; set; }
    public string? FromPersonName { get; set; }
    public string ToLocation { get; set; } = string.Empty;
    public string? ToPersonName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? InitiatedByName { get; set; }
    public string? AcknowledgedByName { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
}