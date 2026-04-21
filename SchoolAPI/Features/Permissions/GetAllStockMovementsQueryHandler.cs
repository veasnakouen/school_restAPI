using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System;

namespace SchoolAPI.Application.Features.StockMovements.GetAll
{
    public class GetAllStockMovementsQueryHandler : IRequestHandler<GetAllStockMovementsQuery, Result<PagedResult<StockMovementDto>>>
    {
        private readonly IApplicationDbContext _context;

        public GetAllStockMovementsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result<PagedResult<StockMovementDto>>> Handle(GetAllStockMovementsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.StockMovements
                .Include(sm => sm.Product)
                .AsNoTracking()
                .AsQueryable();

            // Filtering
            if (!string.IsNullOrWhiteSpace(request.filterOn) && !string.IsNullOrWhiteSpace(request.filterQuery))
            {
                var filter = request.filterQuery.Trim();
                if (request.filterOn.Equals("product", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(sm => sm.Product != null && EF.Functions.ILike(sm.Product.ProductName, $"%{filter}%"));
                }
                else if (request.filterOn.Equals("reference", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(sm => sm.ReferenceNumber != null && EF.Functions.ILike(sm.ReferenceNumber, $"%{filter}%"));
                }
            }

            // Sorting
            query = string.IsNullOrWhiteSpace(request.sortBy)
                ? query.OrderByDescending(sm => sm.MovedAt)
                : request.sortBy.Equals("date", StringComparison.OrdinalIgnoreCase)
                    ? request.isAscending ? query.OrderBy(sm => sm.MovedAt) : query.OrderByDescending(sm => sm.MovedAt)
                    : request.sortBy.Equals("product", StringComparison.OrdinalIgnoreCase)
                        ? request.isAscending ? query.OrderBy(sm => sm.Product != null ? sm.Product.ProductName : "") : query.OrderByDescending(sm => sm.Product != null ? sm.Product.ProductName : "")
                        : query.OrderByDescending(sm => sm.MovedAt);

            var totalCount = await query.CountAsync(cancellationToken);
            var pageNumber = request.pageNumber < 1 ? 1 : request.pageNumber;
            var pageSize = request.pageSize < 1 ? 10 : request.pageSize;
            var dtos = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(sm => new StockMovementDto
            {
                Id = sm.Id.ToString(),
                Type = sm.Type.ToString(),
                Direction = sm.Direction.ToString(),
                ProductId = sm.ProductId.ToString(),
                ProductName = sm.Product != null ? (sm.Product.ProductName ?? "Unknown Product") : "Unknown Product",
                PurchaseItemId = sm.PurchaseItemId != null ? sm.PurchaseItemId.ToString() : null,
                Quantity = sm.Quantity,
                QuantityBefore = sm.QuantityBefore,
                QuantityAfter = sm.QuantityAfter,
                UnitPriceAtMovement = sm.UnitPriceAtMovement ?? 0m,
                FromLocation = sm.FromLocation,
                ToLocation = sm.ToLocation,
                Reason = sm.Reason,
                ReferenceNumber = sm.ReferenceNumber,
                Notes = sm.Notes,
                MovedAt = sm.MovedAt,
                CreatedAt = sm.CreatedAt
            }).ToListAsync(cancellationToken);

            var result = new PagedResult<StockMovementDto> { Items = dtos, TotalCount = totalCount, PageNumber = pageNumber, PageSize = pageSize };
            return Result<PagedResult<StockMovementDto>>.Success(result);
        }
    }
}
