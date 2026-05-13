using System;

namespace SchoolAPI.Contracts;

public class WriteOffDto
{
    public Guid Id { get; set; }
    public string WriteOffNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? EstimatedLossValue { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RequestedByName { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime CreatedAt { get; set; }
}