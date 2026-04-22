using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Products.TransferStock;

public class TransferStockCommandHandler : IRequestHandler<TransferStockCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public TransferStockCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(TransferStockCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products.FindAsync(new object[] { request.ProductId }, cancellationToken);
        if (product == null) return Result.Failure("Product not found.");

        var fromDepartment = await _context.Departments.FindAsync(new object[] { request.FromDepartmentId }, cancellationToken);
        if (fromDepartment == null) return Result.Failure("Source department not found.");

        var toDepartment = await _context.Departments.FindAsync(new object[] { request.ToDepartmentId }, cancellationToken);
        if (toDepartment == null) return Result.Failure("Destination department not found.");

        if (request.Quantity <= 0) return Result.Failure("Transfer quantity must be positive.");
        if (request.FromDepartmentId == request.ToDepartmentId) return Result.Failure("Source and destination departments cannot be the same.");

        // Calculate current stock in the source department
        var stockIn = await _context.PurchaseItems
            .Where(pi => pi.ProductId == request.ProductId && pi.Location == fromDepartment.Name)
            .SumAsync(pi => pi.Quantity, cancellationToken);
            
        var transfersOut = await _context.StockTransfers
            .Where(st => st.ProductId == request.ProductId && st.FromDepartmentId == request.FromDepartmentId)
            .SumAsync(st => st.Quantity, cancellationToken);
            
        var transfersIn = await _context.StockTransfers
            .Where(st => st.ProductId == request.ProductId && st.ToDepartmentId == request.FromDepartmentId)
            .SumAsync(st => st.Quantity, cancellationToken);

        var currentStock = stockIn - transfersOut + transfersIn;

        if (currentStock < request.Quantity)
        {
            return Result.Failure($"Not enough stock in {fromDepartment.Name}. Current stock: {currentStock}, trying to transfer: {request.Quantity}.");
        }

        var stockTransfer = new StockTransfer
        {
            Id = Guid.NewGuid().ToString(),
            ProductId = request.ProductId,
            FromDepartmentId = request.FromDepartmentId,
            ToDepartmentId = request.ToDepartmentId,
            Quantity = request.Quantity,
            Notes = request.Notes,
            CreatedDate = DateTime.UtcNow
        };

        _context.StockTransfers.Add(stockTransfer);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}