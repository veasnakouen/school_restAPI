using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Common.Interfaces;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;
using SchoolAPI.Helpers;
using SchoolAPI.Interfaces;

namespace SchoolAPI.Application.Features.Products.GetAll;

public class GetAllProductsQueryHandler : IRequestHandler<GetAllProductsQuery, Result<PagedResult<ProductDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICacheStore _cacheStore;
    private readonly ICacheVersionService _cacheVersionService;

    public GetAllProductsQueryHandler(IApplicationDbContext context, IMapper mapper, ICacheStore cacheStore, ICacheVersionService cacheVersionService)
    {
        _context = context;
        _mapper = mapper;
        _cacheStore = cacheStore;
        _cacheVersionService = cacheVersionService;
    }

    public async Task<Result<PagedResult<ProductDto>>> Handle(GetAllProductsQuery request, CancellationToken cancellationToken)
    {
        var cacheVersion = _cacheVersionService.GetVersion("products");
        var cacheKey = CacheKeyBuilder.BuildProductListKey(cacheVersion, request.filterOn, request.filterQuery, request.sortBy, request.isAscending, request.pageNumber, request.pageSize);
        var cachedResult = await _cacheStore.GetAsync<PagedResult<ProductDto>>(cacheKey, cancellationToken);
        if (cachedResult != null)
        {
            return Result<PagedResult<ProductDto>>.Success(cachedResult);
        }

        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Include(p => p.Image)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.filterOn) && !string.IsNullOrWhiteSpace(request.filterQuery))
        {
            var filter = request.filterQuery.Trim();
            if (request.filterOn.Equals("name", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Name.Contains(filter));
            }
            else if (request.filterOn.Equals("code", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.CodeNumber != null && p.CodeNumber.Contains(filter));
            }
            else if (request.filterOn.Equals("brand", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Brand != null && p.Brand.Name.Contains(filter));
            }
            else if (request.filterOn.Equals("category", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Category != null && p.Category.Name.Contains(filter));
            }
        }

        query = string.IsNullOrWhiteSpace(request.sortBy)
            ? query.OrderByDescending(p => p.CreatedDate)
            : request.sortBy.Equals("name", StringComparison.OrdinalIgnoreCase)
                ? request.isAscending ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name)
                : request.sortBy.Equals("price", StringComparison.OrdinalIgnoreCase)
                    ? request.isAscending ? query.OrderBy(p => p.Price) : query.OrderByDescending(p => p.Price)
                    : request.sortBy.Equals("createddate", StringComparison.OrdinalIgnoreCase)
                        ? request.isAscending ? query.OrderBy(p => p.CreatedDate) : query.OrderByDescending(p => p.CreatedDate)
                        : query.OrderByDescending(p => p.CreatedDate);

        var totalCount = await query.CountAsync(cancellationToken);
        var pageNumber = request.pageNumber < 1 ? 1 : request.pageNumber;
        var pageSize = request.pageSize < 1 ? 10 : request.pageSize;
        var skip = (pageNumber - 1) * pageSize;

        var products = await query.Skip(skip).Take(pageSize).ToListAsync(cancellationToken);

        var result = Result<PagedResult<ProductDto>>.Success(new PagedResult<ProductDto>
        {
            Items = _mapper.Map<List<ProductDto>>(products),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });

        await _cacheStore.SetAsync(cacheKey, result.Data, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(2), cancellationToken);

        return result;
    }
}
