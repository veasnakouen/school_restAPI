namespace SchoolAPI.Entities;
// ─────────────────────────────────────
// Every single movement is one record
// ─────────────────────────────────────
public class StockMovement
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public MovementType Type { get; set; }

    public MovementDirection Direction { get; set; } // In / Out / Neutral

    // ── What moved ──────────────────────
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid? PurchaseItemId { get; set; }    // which specific purchase batch
    public PurchaseItem? PurchaseItem { get; set; }

    public int Quantity { get; set; }            // always positive

    // ── Snapshot at time of movement ────
    public int QuantityBefore { get; set; }      // for audit trail
    public int QuantityAfter { get; set; }

    public decimal? UnitPriceAtMovement { get; set; }

    // ── Where ───────────────────────────
    public string? FromLocation { get; set; }
    public string? ToLocation { get; set; }

    // ── Who ─────────────────────────────
    public Guid? FromPersonId { get; set; }      // returned from
    public Person? FromPerson { get; set; }

    public Guid? ToPersonId { get; set; }        // assigned to
    public Person? ToPerson { get; set; }

    public Guid MovedById { get; set; }          // who performed action
    public Person? MovedBy { get; set; }

    // ── Why ─────────────────────────────
    public string? Reason { get; set; }
    public string? ReferenceNumber { get; set; } // e.g. Transfer#, WriteOff#
    public string? Notes { get; set; }

    // ── Condition ───────────────────────
    public int? PercentNewBefore { get; set; }
    public int? PercentNewAfter { get; set; }

    public DateTime MovedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

