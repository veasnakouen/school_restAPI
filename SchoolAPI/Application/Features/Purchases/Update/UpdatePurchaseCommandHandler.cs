using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Purchases.Update;

public class UpdatePurchaseCommandHandler : IRequestHandler<UpdatePurchaseCommand, Result<PurchaseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;

    public UpdatePurchaseCommandHandler(IApplicationDbContext context, IMapper mapper, ICurrentUserService currentUserService)
    {
        _context = context;
        _mapper = mapper;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PurchaseDto>> Handle(UpdatePurchaseCommand request, CancellationToken cancellationToken)
    {
        var purchase = await _context.Purchases
            .Include(p => p.PurchaseItems)
            .FirstOrDefaultAsync(p => p.Id == request.PurchaseId, cancellationToken);

        if (purchase == null)
        {
            return Result<PurchaseDto>.Failure("Purchase not found.");
        }

        var req = request.Request;

        // 1. Validate and get Supplier
        Supplier? supplier = null;
        if (!string.IsNullOrEmpty(req.SupplierId))
        {
            supplier = await _context.Suppliers.FindAsync(new object[] { req.SupplierId }, cancellationToken);
            if (supplier == null)
            {
                return Result<PurchaseDto>.Failure("Supplier not found.");
            }
        }

        // 2. Validate all Products
        var productIds = req.Items.Select(i => i.ProductId).Distinct().ToList();
        var productDictionary = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p, cancellationToken);
        if (productDictionary.Count != productIds.Count)
        {
            var missingIds = string.Join(", ", productIds.Except(productDictionary.Keys));
            return Result<PurchaseDto>.Failure($"One or more products in the purchase could not be found: {missingIds}");
        }

        var movedById = Guid.TryParse(_currentUserService.UserId, out var uid) ? uid : Guid.Empty;

        // 3. Remove old items and create new ones
        foreach (var oldItem in purchase.PurchaseItems)
        {
            // Revert previous stock movements for this purchase
            _context.StockMovements.Add(new StockMovement
            {
                ProductId = Guid.Parse(oldItem.ProductId),
                PurchaseItem = oldItem,
                Quantity = oldItem.Quantity,
                Direction = MovementDirection.Out,
                Type = MovementType.Purchase, 
                ReferenceNumber = purchase.VoucherNumber,
                Notes = "Purchase updated - reverting old item",
                MovedById = movedById
            });
        }

        _context.PurchaseItems.RemoveRange(purchase.PurchaseItems);
        
        decimal totalAmount = 0;
        var newPurchaseItems = new List<PurchaseItem>();

        foreach (var item in req.Items)
        {
            totalAmount += item.Quantity * item.UnitPrice;
            var newItem = new PurchaseItem
            {
                ProductId = item.ProductId,
                Product = productDictionary[item.ProductId],
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            };
            newPurchaseItems.Add(newItem);
            
            // Add new stock movements
            _context.StockMovements.Add(new StockMovement
            {
                ProductId = Guid.Parse(item.ProductId),
                PurchaseItem = newItem,
                Quantity = item.Quantity,
                Direction = MovementDirection.In,
                Type = MovementType.Purchase, 
                ReferenceNumber = req.ReferenceNumber ?? purchase.VoucherNumber,
                Notes = "Purchase updated - adding new item",
                MovedById = movedById
            });
        }

        // 4. Update the main Purchase entity
        purchase.SupplierId = req.SupplierId;
        purchase.Supplier = supplier;
        purchase.VoucherNumber = req.ReferenceNumber ?? purchase.VoucherNumber;
        purchase.InvoiceDate = req.PurchaseDate ?? purchase.InvoiceDate;
        purchase.TotalAmount = totalAmount;
        purchase.Notes = req.Notes ?? purchase.Notes;
        purchase.Status = req.Status ?? purchase.Status;
        purchase.PurchaseItems = newPurchaseItems;

        await _context.SaveChangesAsync(cancellationToken);

        // 5. Map the updated entity (with its loaded navigation properties) to the DTO and return
        return Result<PurchaseDto>.Success(_mapper.Map<PurchaseDto>(purchase));
    }
}