namespace SchoolAPI.Entities;

// ─────────────────────────────────────
// Tracks WHO currently holds WHAT
// ─────────────────────────────────────
public class AssetAssignment : BaseAuditableEntity
{
    public string ProductId { get; set; } = string.Empty;
    public Product Product { get; set; } = null!;

    public string? PurchaseItemId { get; set; }   // from which batch
    public PurchaseItem? PurchaseItem { get; set; }

    public int Quantity { get; set; }

    // ── Assignment details ──────────────
    public Guid AssignedToId { get; set; }
    public Person AssignedTo { get; set; } = null!;

    public Guid AssignedById { get; set; }      // who authorized
    public Person AssignedBy { get; set; } = null!;

    public string Location { get; set; } = string.Empty;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpectedReturnDate { get; set; }

    public string? Purpose { get; set; }        // why assigned

    public string? Notes { get; set; }

    // ── Return details ──────────────────
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Active;

    public DateTime? ReturnedAt { get; set; }

    public Guid? ReturnedToId { get; set; }
    public Person? ReturnedTo { get; set; }

    public int? ConditionOnReturn { get; set; } // %New when returned

    public string? ReturnNotes { get; set; }

    // ── Linked movement ─────────────────
    public string StockMovementId { get; set; } = string.Empty;   // the movement that created this
    public StockMovement StockMovement { get; set; } = null!;
}
