using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Products.TransferStock;

public class TransferStockCommand : IRequest<Result>
{
    public string ProductId { get; set; } = null!;
    public string FromDepartmentId { get; set; } = null!;
    public string ToDepartmentId { get; set; } = null!;
    public int Quantity { get; set; }
    public string? Notes { get; set; }
}