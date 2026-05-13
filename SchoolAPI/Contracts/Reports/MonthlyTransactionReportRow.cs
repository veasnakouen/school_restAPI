namespace SchoolAPI.Contracts.Reports;

public class MonthlyTransactionReportRow
{
    public DateTime TransactionDate { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public string DonorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string ResponserName { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal TotalCost { get; set; }
}