namespace SchoolAPI.Entities;

public class PurchaseItem : BaseEntity
{
    // foreign key mapping to the Purchase this item belongs to
    public string PurchaseId { get; set; } = string.Empty;
    public Purchase? Purchase { get; set; }

    // The Foreign Key mapping to your Product
    public string ProductId { get; set; } = string.Empty;
    public Product? Product { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal TotalPrice => UnitPrice * Quantity;

    public int PercentNew { get; set; } = 100;  // %New at time of purchase

    public string Location { get; set; } = string.Empty;

    public Guid? ResponsiblePersonId { get; set; }
    public Person? ResponsiblePerson { get; set; }

    // Category-specific extras (e.g. PlateNo, SerialNo)
    public string? SerialNumber { get; set; }
    public Dictionary<string, string> ExtraAttributes { get; set; } = [];

    public string? Notes { get; set; }
}