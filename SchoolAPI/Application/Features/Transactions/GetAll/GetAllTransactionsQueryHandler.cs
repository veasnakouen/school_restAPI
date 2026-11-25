using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Entities;
using SchoolAPI.Extensions;
using SchoolAPI.Helpers;

namespace SchoolAPI.Application.Features.Transactions.GetAll;

public class GetAllTransactionsQueryHandler : IRequestHandler<GetAllTransactionsQuery, Result<PagedResult<TransactionDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetAllTransactionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<TransactionDto>>> Handle(GetAllTransactionsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Transactions
            .Include(t => t.Product)
            .Include(t => t.Department)
            .Include(t => t.Donor)
            .Include(t => t.Responser)
            .AsNoTracking();

        // Add date filtering
        if (request.StartDate.HasValue)
        {
            var startDate = request.StartDate.Value.ToUniversalTime().Date;
            query = query.Where(t => t.CreatedDate >= startDate);
        }

        if (request.EndDate.HasValue)
        {
            var endDate = request.EndDate.Value.ToUniversalTime().Date.AddDays(1).AddTicks(-1);
            query = query.Where(t => t.CreatedDate <= endDate);
        }

        if (!string.IsNullOrWhiteSpace(request.DepartmentId))
        {
            var deptIds = request.DepartmentId.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
            query = query.Where(t => deptIds.Contains(t.DepartmentId));
        }

        if (!string.IsNullOrWhiteSpace(request.TransactionType) &&
            Enum.TryParse<TransactionType>(request.TransactionType.Trim(), true, out var parsedType))
        {
            query = query.Where(t => t.TransactionType == parsedType);
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var term = $"%{request.Name.Trim()}%";
            query = query.Where(t =>
                EF.Functions.ILike(t.Product.ProductName, term) ||
                (t.Product.CodeNumber != null && EF.Functions.ILike(t.Product.CodeNumber, term)) ||
                EF.Functions.ILike(t.ProviderName, term) ||
                EF.Functions.ILike(t.Donor.Name, term) ||
                EF.Functions.ILike(t.Department.Name, term) ||
                EF.Functions.ILike(t.Responser.Name, term) ||
                EF.Functions.ILike(t.Resource, term));
        }

        if (!string.IsNullOrWhiteSpace(request.FilterOn) && !string.IsNullOrWhiteSpace(request.FilterQuery))
        {
            var fq = request.FilterQuery.Trim();
            if (request.FilterOn.Equals("transactionType", StringComparison.OrdinalIgnoreCase) &&
                Enum.TryParse<TransactionType>(fq, true, out var filterEnumType))
            {
                query = query.Where(t => t.TransactionType == filterEnumType);
            }
            else if (request.FilterOn.Equals("departmentName", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => EF.Functions.ILike(t.Department.Name, $"%{fq}%"));
            }
            else if (request.FilterOn.Equals("productName", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => EF.Functions.ILike(t.Product.ProductName, $"%{fq}%"));
            }
        }

        query = VehicleFilterHelper.ApplyTransactionVehicleFilter(query, request.VehicleType);

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "totalcost" => request.IsAscending ? query.OrderBy(t => t.TotalCost) : query.OrderByDescending(t => t.TotalCost),
            "quantity" => request.IsAscending ? query.OrderBy(t => t.Quantity) : query.OrderByDescending(t => t.Quantity),
            "productname" => request.IsAscending ? query.OrderBy(t => t.Product.ProductName) : query.OrderByDescending(t => t.Product.ProductName),
            _ => request.IsAscending ? query.OrderBy(t => t.CreatedDate) : query.OrderByDescending(t => t.CreatedDate)
        };

        var pagedResult = await query
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                ProductId = t.ProductId,
                ProductName = t.Product.ProductName,
                TransactionType = t.TransactionType,
                ProviderName = t.ProviderName,
                DonorId = t.DonorId,
                DonorName = t.Donor.Name,
                DepartmentId = t.DepartmentId,
                DepartmentName = t.Department.Name,
                ResponserId = t.ResponserId,
                ResponserName = t.Responser.Name,
                Resource = t.Resource,
                Quantity = t.Quantity,
                TotalCost = t.TotalCost,
                PlateNumber = t.Product.PlateNumber,
                EngineNumber = t.Product.EngineNumber,
                CreatedDate = t.CreatedDate.HasValue ? t.CreatedDate.Value.ToString("o") : null,
                UpdateDate = t.UpdateDate.HasValue ? t.UpdateDate.Value.ToString("o") : null
            })
            .ToPagedResultAsync(request.PageNumber, request.PageSize, cancellationToken);

        return Result<PagedResult<TransactionDto>>.Success(pagedResult);
    }
}