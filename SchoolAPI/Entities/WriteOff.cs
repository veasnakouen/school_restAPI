namespace SchoolAPI.Entities;

public class WriteOff : BaseAuditableEntity
{
    public string WriteOffNumber { get; set; } = string.Empty; // WO-2024-001

    public string ProductId { get; set; } = string.Empty;
    public Product Product { get; set; } = null!;

    public string? PurchaseItemId { get; set; }
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

    public string? StockMovementId { get; set; }
    public StockMovement? StockMovement { get; set; }
}
