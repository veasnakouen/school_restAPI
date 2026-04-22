namespace SchoolAPI.Entities;

public class Purchase : BaseAuditableEntity
{
    public string SupplierId { get; set; } = string.Empty;
    public Supplier? Supplier { get; set; }
    
    public string? VoucherNumber { get; set; } // e.g., Invoice # or PO #
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "Completed"; // e.g., Pending, Received, Completed

    // Navigation property: One Purchase has many PurchaseItems
    public ICollection<PurchaseItem> PurchaseItems { get; set; } = new List<PurchaseItem>();
}