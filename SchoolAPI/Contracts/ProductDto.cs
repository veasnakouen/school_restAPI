namespace SchoolAPI.Contracts;

public class ProductDto
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? BrandId { get; set; }
    public string? BrandName { get; set; }
    public decimal? Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? QualityId { get; set; }
    public string? Quality { get; set; }
    public string? CreatedDate { get; set; }
    public string? UpdateDate { get; set; }
    public string? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? CodeNumber { get; set; }
    public string? Year { get; set; }
    public string? Attributes { get; set; }
    public string? PlateNumber { get; set; }
    public string? EngineNumber { get; set; }
    public bool IsActive { get; set; }

    // Acquisition fields
    public string? PurchaseType { get; set; }
    public int? InitialQuantity { get; set; }
    public string? SupplierName { get; set; }
    public string? DonorName { get; set; }
    public string? VoucherNumber { get; set; }
    public string? SupplierContact { get; set; }
    public string? InvoiceDate { get; set; }
    public string? ResponsiblePerson { get; set; }

    // History
    public List<ProductPurchaseHistoryDto>? PurchaseHistory { get; set; }
}