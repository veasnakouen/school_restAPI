namespace SchoolAPI.Entities;

public class Product
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? CodeNumber { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? Price { get; set; }

    // Product specifications or other attributes as a string.
    public string? Attributes { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime? Year { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? PlateNumber { get; set; } 
    public string? EngineNumber { get; set; }

    // ── Inventory (auto-updated) ─────────
    public int TotalQuantity { get; set; }      // sum of all purchases
    public int AvailableQuantity { get; set; }  // TotalQty - assigned
    public int AssignedQuantity { get; set; }   // currently in use

    // One-to-one relationship with ProductImage
    public string? BrandId { get; set; }
    public Brand? Brand { get; set; }
    public string? CategoryId { get; set; }
    public Category? Category { get; set; }
    public ProductImage? Image { get; set; }
    public string? QualityId { get; set; }
    public Quality? Quality { get; set; }
    public string? DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    // Vehicle-specific fields

    // A product can be purchased multiple times across different purchase orders
    public ICollection<PurchaseItem> PurchaseItems { get; set; } = new List<PurchaseItem>();
}
