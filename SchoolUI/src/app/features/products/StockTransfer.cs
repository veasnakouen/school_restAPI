using SchoolAPI.Entities.Base;

namespace SchoolAPI.Entities;

public class StockTransfer : BaseAuditableEntity
{
    public string ProductId { get; set; } = null!;
    public Product Product { get; set; } = null!;

    public string FromDepartmentId { get; set; } = null!;
    public Department FromDepartment { get; set; } = null!;

    public string ToDepartmentId { get; set; } = null!;
    public Department ToDepartment { get; set; } = null!;

    public int Quantity { get; set; }

    public string? Notes { get; set; }
}