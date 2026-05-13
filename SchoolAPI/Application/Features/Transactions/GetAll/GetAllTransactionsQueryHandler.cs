using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Extensions;

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
        
        query = query.OrderByDescending(t => t.CreatedDate);

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
                CreatedDate = t.CreatedDate.HasValue ? t.CreatedDate.Value.ToString("o") : null,
                UpdateDate = t.UpdateDate.HasValue ? t.UpdateDate.Value.ToString("o") : null
            })
            .ToPagedResultAsync(request.PageNumber, request.PageSize, cancellationToken);

        return Result<PagedResult<TransactionDto>>.Success(pagedResult);
    }
}