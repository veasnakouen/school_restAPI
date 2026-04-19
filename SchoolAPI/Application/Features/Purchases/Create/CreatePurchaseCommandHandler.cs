using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;

namespace SchoolAPI.Application.Features.Purchases.Create;

public class CreatePurchaseCommandHandler : IRequestHandler<CreatePurchaseCommand, Result<PurchaseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;

    public CreatePurchaseCommandHandler(IApplicationDbContext context, IMapper mapper, ICurrentUserService currentUserService)
    {
        _context = context;
        _mapper = mapper;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PurchaseDto>> Handle(CreatePurchaseCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        // 1. Validate Supplier
        var supplier = await _context.Suppliers.FindAsync(new object[] { req.SupplierId }, cancellationToken);
        if (supplier == null)
        {
            return Result<PurchaseDto>.Failure("Supplier not found.");
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

        decimal totalAmount = 0;
        var purchaseItems = new List<PurchaseItem>();

        // 3. Process each line item
        foreach (var item in req.Items)
        {
            totalAmount += item.Quantity * item.UnitPrice;
            purchaseItems.Add(new PurchaseItem
            {
                ProductId = item.ProductId,
                Product = productDictionary[item.ProductId],
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });
        }
        
        var movedById = Guid.TryParse(_currentUserService.UserId, out var uid) ? uid : Guid.Empty;

        // 4. Create the main Purchase
        var purchase = new Purchase
        {
            Id = Guid.NewGuid().ToString(),
            SupplierId = req.SupplierId,
            Supplier = supplier,
            VoucherNumber = req.ReferenceNumber ?? string.Empty,
            InvoiceDate = req.PurchaseDate ?? DateTime.UtcNow,
            TotalAmount = totalAmount,
            Notes = req.Notes ?? string.Empty,
            Status = req.Status,
            PurchaseItems = purchaseItems
        };

        // 5. Create Stock Movements
        foreach (var item in purchaseItems)
        {
            _context.StockMovements.Add(new StockMovement
            {
                ProductId = Guid.Parse(item.ProductId),
                PurchaseItem = item,
                Quantity = item.Quantity,
                Direction = MovementDirection.In, // Use your actual enum value if different
                Type = MovementType.Purchase,     // Use your actual enum value if different
                ReferenceNumber = purchase.VoucherNumber,
                Notes = "Purchase created",
                MovedById = movedById
                // QuantityBefore = ..., // Set these if you have a method to calculate current stock 
                // QuantityAfter = ...
            });
        }

        _context.Purchases.Add(purchase);
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Map the created entity (with its loaded navigation properties) to the DTO and return
        return Result<PurchaseDto>.Success(_mapper.Map<PurchaseDto>(purchase));
    }
}