using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Helpers;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Transactions.GetAll;

public class GetAllTransactionsQueryHandler : IRequestHandler<GetAllTransactionsQuery, Result<PagedResult<TransactionDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheStore _cacheStore;
    private readonly ICacheVersionService _cacheVersionService;

    public GetAllTransactionsQueryHandler(IApplicationDbContext context, IMapper mapper, ICacheStore cacheStore, ICacheVersionService cacheVersionService)
    {
        _context = context;
        _mapper = mapper;
        _cacheStore = cacheStore;
        _cacheVersionService = cacheVersionService;
    }

    public async Task<Result<PagedResult<TransactionDto>>> Handle(GetAllTransactionsQuery request, CancellationToken cancellationToken)
    {
        var cacheVersion = _cacheVersionService.GetVersion("transactions");
        var cacheKey = CacheKeyBuilder.BuildTransactionListKey(cacheVersion, request.filterOn, request.filterQuery, request.sortBy, request.isAscending, request.pageNumber, request.pageSize);
        var cachedResult = await _cacheStore.GetAsync<PagedResult<TransactionDto>>(cacheKey, cancellationToken);
        if (cachedResult != null)
        {
            return Result<PagedResult<TransactionDto>>.Success(cachedResult);
        }

        var query = _context.Transactions
            .Include(x => x.Product)
            .Include(x => x.Donor)
            .Include(x => x.Department)
            .Include(x => x.Responser)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.filterOn) && !string.IsNullOrWhiteSpace(request.filterQuery))
        {
            var filter = request.filterQuery.Trim();
            if (request.filterOn.Equals("product", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.Product != null && x.Product.ProductName.Contains(filter));
            }
            else if (request.filterOn.Equals("donor", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.Donor != null && x.Donor.Name.Contains(filter));
            }
            else if (request.filterOn.Equals("department", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.Department != null && x.Department.Name.Contains(filter));
            }
            else if (request.filterOn.Equals("responser", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.Responser != null && x.Responser.Name.Contains(filter));
            }
            else if (request.filterOn.Equals("type", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(x => x.TransactionType.ToString().Contains(filter));
            }
        }

        query = string.IsNullOrWhiteSpace(request.sortBy)
            ? query.OrderByDescending(x => x.CreatedDate)
            : request.sortBy.Equals("product", StringComparison.OrdinalIgnoreCase)
                ? request.isAscending ? query.OrderBy(x => x.Product.ProductName) : query.OrderByDescending(x => x.Product.ProductName)
                : request.sortBy.Equals("createddate", StringComparison.OrdinalIgnoreCase)
                    ? request.isAscending ? query.OrderBy(x => x.CreatedDate) : query.OrderByDescending(x => x.CreatedDate)
                    : request.sortBy.Equals("quantity", StringComparison.OrdinalIgnoreCase)
                        ? request.isAscending ? query.OrderBy(x => x.Quantity) : query.OrderByDescending(x => x.Quantity)
                        : query.OrderByDescending(x => x.CreatedDate);

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.pageNumber < 1 ? 1 : request.pageNumber;
        var pageSize = request.pageSize < 1 ? 10 : request.pageSize;
        var skip = (pageNumber - 1) * pageSize;

        var transactions = await query.Skip(skip).Take(pageSize).ToListAsync(cancellationToken);

        var result = Result<PagedResult<TransactionDto>>.Success(new PagedResult<TransactionDto>
        {
            Items = _mapper.Map<List<TransactionDto>>(transactions),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });

        await _cacheStore.SetAsync(cacheKey, result.Data, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(2), cancellationToken);

        return result;
    }
}
