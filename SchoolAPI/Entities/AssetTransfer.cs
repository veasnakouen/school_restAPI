namespace SchoolAPI.Entities;

public class AssetTransfer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string TransferNumber { get; set; } = string.Empty; // TR-2024-001

    public string ProductId { get; set; } = string.Empty;
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }

    // ── From ────────────────────────────
    public string? FromLocation { get; set; }
    public Guid? FromPersonId { get; set; }
    public Person? FromPerson { get; set; }

    // ── To ──────────────────────────────
    public string ToLocation { get; set; } = string.Empty;
    public Guid? ToPersonId { get; set; }
    public Person? ToPerson { get; set; }

    public TransferStatus Status { get; set; } = TransferStatus.Pending;

    public Guid InitiatedById { get; set; }
    public Person? InitiatedBy { get; set; }

    public Guid? AcknowledgedById { get; set; } // receiver confirms
    public Person? AcknowledgedBy { get; set; }

    public DateTime? AcknowledgedAt { get; set; }

    public string? Reason { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid? StockMovementId { get; set; }
    public StockMovement? StockMovement { get; set; }
}
