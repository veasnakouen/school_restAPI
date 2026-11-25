namespace SchoolAPI.Contracts.Reports;

public sealed class QuickBooksReconciliationRequestDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string PeriodLabel { get; set; } = string.Empty;
    public string? DepartmentId { get; set; }
    public string? PurchaseType { get; set; }
    public string? VehicleType { get; set; }
    public string PreparedBy { get; set; } = string.Empty;
    public string PreparedRole { get; set; } = "Management Assistant";
    public string ReviewedBy { get; set; } = string.Empty;
    public string ReviewedRole { get; set; } = "Co-Director";
    public decimal? QuickBooksReferenceTotal { get; set; }
    public Dictionary<string, string>? AccountMappings { get; set; }
    public bool IncludeMonthlyDepartmentSubReport { get; set; } = true;
}

public sealed class ReconciliationRowDto
{
    public string ProductId { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string? PlateNumber { get; set; }
    public string? EngineNumber { get; set; }
    public string AccountGroup { get; set; } = string.Empty;
    public string MonthKey { get; set; } = string.Empty;
    public string MonthLabel { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}

public sealed class ReconciliationAccountGroupDto
{
    public string AccountGroup { get; set; } = string.Empty;
    public List<ReconciliationRowDto> Rows { get; set; } = [];
    public decimal Subtotal { get; set; }
}

public sealed class ReconciliationSummaryItemDto
{
    public string CategoryLabel { get; set; } = string.Empty;
    public int ItemCount { get; set; }
    public int TotalQuantity { get; set; }
    public decimal Amount { get; set; }
}

public sealed class DepartmentMonthlyAmountRowDto
{
    public string Department { get; set; } = string.Empty;
    public Dictionary<string, decimal> MonthlyAmounts { get; set; } = new();
    public int TotalItems { get; set; }
    public int TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
}

public sealed class QuickBooksReconciliationResponseDto
{
    public string PeriodLabel { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string PreparedBy { get; set; } = string.Empty;
    public string PreparedRole { get; set; } = "Management Assistant";
    public string ReviewedBy { get; set; } = string.Empty;
    public string ReviewedRole { get; set; } = "Co-Director";
    public List<ReconciliationAccountGroupDto> AccountGroups { get; set; } = [];
    public List<ReconciliationSummaryItemDto> RecordedSummary { get; set; } = [];
    public List<string> Months { get; set; } = [];
    public List<DepartmentMonthlyAmountRowDto> DepartmentMonthlySubReport { get; set; } = [];
    public Dictionary<string, decimal> MonthColumnTotals { get; set; } = new();
    public decimal GrandTotal { get; set; }
    public decimal? QuickBooksReferenceTotal { get; set; }
    public decimal? VarianceAmount { get; set; }
    public int TotalItems { get; set; }
    public int TotalQuantity { get; set; }
    public bool IncludeVehicleColumns { get; set; }
}
