namespace SchoolAPI.Entities;

public class MaintenanceRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string MaintenanceNumber { get; set; } = string.Empty;

    public string ProductId { get; set; } = string.Empty;
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }

    public MaintenanceType Type { get; set; }    // Scheduled, Emergency, Preventive

    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Scheduled;

    public string? IssuedescRiption { get; set; }

    public string? ResolutionDescription { get; set; }

    // ── Condition change ────────────────
    public int ConditionBefore { get; set; }    // %New before
    public int? ConditionAfter { get; set; }    // %New after

    // ── Cost ────────────────────────────
    public decimal? EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }

    public Guid? TechnicianId { get; set; }
    public Person? Technician { get; set; }

    public DateTime ScheduledDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public Guid? SentForMaintenanceMovementId { get; set; }
    public Guid? ReturnedFromMaintenanceMovementId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
public enum MaintenanceType { Scheduled, Emergency, Preventive }
public enum MaintenanceStatus { Scheduled, InProgress, Completed, Cancelled }
