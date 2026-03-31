using SchoolAPI.Entities;

namespace SchoolAPI.Contracts;

public class TransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public TransactionType TransactionType { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string DonorId { get; set; } = string.Empty;
    public string DonorName { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string ResponserId { get; set; } = string.Empty;
    public string ResponserName { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal TotalCost { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime UpdateDate { get; set; }
}
