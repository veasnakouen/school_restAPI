using System;

namespace SchoolAPI.Contracts;

public class MaintenanceRecordDto
{
    public Guid Id { get; set; }
    public string MaintenanceNumber { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public int Quantity { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? IssuedescRiption { get; set; }
    public string? ResolutionDescription { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public string? TechnicianName { get; set; }
    public DateTime ScheduledDate { get; set; }
    public DateTime? CompletedAt { get; set; }
}