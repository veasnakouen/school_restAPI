namespace SchoolAPI.Entities;

public class Transaction : BaseAuditableEntity
{
    public string ProductId { get; set; } = string.Empty;
    public Product Product { get; set; } = null!;
    public TransactionType TransactionType { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public string DonorId { get; set; } = string.Empty;
    public Donor Donor { get; set; } = null!;
    public string DepartmentId { get; set; } = string.Empty;
    public Department Department { get; set; } = null!;
    public string ResponserId { get; set; } = string.Empty;
    public Responser Responser { get; set; } = null!;
    public string Resource { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal TotalCost { get; set; }
}