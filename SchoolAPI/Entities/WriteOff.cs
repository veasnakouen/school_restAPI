namespace SchoolAPI.Entities;

public class WriteOff
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string WriteOffNumber { get; set; } = string.Empty; // WO-2024-001

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid? PurchaseItemId { get; set; }
    public PurchaseItem? PurchaseItem { get; set; }

    public int Quantity { get; set; }

    public WriteOffReason Reason { get; set; }

    public string? Description { get; set; }

    public int ConditionAtWriteOff { get; set; }    // %New

    public decimal? EstimatedLossValue { get; set; }

    // ── Approval ────────────────────────
    public WriteOffStatus Status { get; set; } = WriteOffStatus.Pending;

    public Guid RequestedById { get; set; }
    public Person? RequestedBy { get; set; }

    public Guid? ApprovedById { get; set; }
    public Person? ApprovedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public string? ApprovalNotes { get; set; }

    public string? SupportingDocument { get; set; } // file path/url

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid? StockMovementId { get; set; }
    public StockMovement? StockMovement { get; set; }
}
