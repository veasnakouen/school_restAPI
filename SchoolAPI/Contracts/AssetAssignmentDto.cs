using System;

namespace SchoolAPI.Contracts;

public class AssetAssignmentDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public string? AssignedToName { get; set; }
    public string? AssignedByName { get; set; }
    public string Location { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? ExpectedReturnDate { get; set; }
    public string? Purpose { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ReturnedAt { get; set; }
    public string? ReturnedToName { get; set; }
}