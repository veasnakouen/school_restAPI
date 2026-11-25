namespace SchoolAPI.Contracts.Reports;

public sealed class CustomInventoryReportRequestDto
{
    public string CompanyName { get; set; } = "Organization Inventory";
    public string ReportTitle { get; set; } = "Inventory & Asset Report";
    public string Period { get; set; } = "All Time";
    public string DepartmentLabel { get; set; } = "All Departments";
    public string PreparedBy { get; set; } = string.Empty;
    public string CheckedBy { get; set; } = string.Empty;
    public string ApprovedBy { get; set; } = string.Empty;
    public string? LogoBase64 { get; set; }

    /// <summary>
    /// "Standard" (executive summary + dynamic columns) or "LegacyYearlyList" (13-column landscape inventory list with shaded Total {Year} subtotals).
    /// </summary>
    public string TemplateStyle { get; set; } = "Standard";

    /// <summary>
    /// "None" (single sheet), "Category", "Department", or "Year" (multi-sheet workbook).
    /// </summary>
    public string GroupBy { get; set; } = "Category";

    public List<string> Columns { get; set; } =
    [
        "codeNumber", "name", "categoryName", "brandName", "departmentName",
        "quality", "initialQuantity", "price", "totalValue", "responsiblePerson"
    ];

    // Query Filters
    public string? Name { get; set; }
    public string? CategoryId { get; set; }
    public string? DepartmentId { get; set; }
    public string? QualityId { get; set; }
    public string? ProductGroup { get; set; }
    public string? PurchaseType { get; set; }
    public DateTime? InvoiceStartDate { get; set; }
    public DateTime? InvoiceEndDate { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? VehicleType { get; set; }
}
